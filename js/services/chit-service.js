/* =========================================================
   Money — js/services/chit-service.js
   Chit Fund Life-Cycle Management, Calculations & Idempotent Ledger Integration
   ========================================================= */

import { Repository } from '../storage/repository.js';
import { TransactionService } from './transaction-service.js';

const STORE_CHITS = 'chits';
const STORE_AUCTIONS = 'chit_auctions';
const STORE_PAYMENTS = 'chit_payments';

export const ChitService = {
  // --- CRUD ---
  async getAllChits() {
    const list = await Repository.getAll(STORE_CHITS);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getChitById(id) {
    return await Repository.getById(STORE_CHITS, id);
  },

  async addChit(data) {
    const record = {
      name: data.name || 'New Chit',
      value: parseFloat(data.value) || 100000,
      members: parseInt(data.members) || 10,
      monthly: parseFloat(data.monthly) || 10000,
      duration: parseInt(data.duration) || 10,
      commType: data.commType || 'percent', // 'percent' | 'fixed'
      commVal: parseFloat(data.commVal) || 5,
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      currentMonth: parseInt(data.currentMonth) || 1,
      notes: data.notes || '',
      myName: data.myName || 'User',
      taken: false,
      takenMonth: null,
      takenAmount: 0
    };
    return await Repository.save(STORE_CHITS, record);
  },

  async updateChit(id, data) {
    const existing = await Repository.getById(STORE_CHITS, id);
    if (!existing) return null;
    return await Repository.save(STORE_CHITS, { ...existing, ...data });
  },

  async deleteChit(id) {
    return await Repository.softDelete(STORE_CHITS, id);
  },

  // --- AUCTIONS ---
  async getAuctionsForChit(chitId) {
    const all = await Repository.getAll(STORE_AUCTIONS);
    return all.filter(a => a.chitId === chitId).sort((a, b) => a.month - b.month);
  },

  async logAuction(chitId, auctionData) {
    const record = {
      chitId,
      month: parseInt(auctionData.month),
      winner: auctionData.winner || 'Unknown',
      bid: parseFloat(auctionData.bid) || 0,
      comm: parseFloat(auctionData.comm) || 0,
      date: auctionData.date || new Date().toISOString().slice(0, 10),
      status: 'completed'
    };

    const saved = await Repository.save(STORE_AUCTIONS, record);

    // Update chit currentMonth if necessary
    const chit = await this.getChitById(chitId);
    if (chit && record.month >= chit.currentMonth) {
      await this.updateChit(chitId, { currentMonth: record.month + 1 });
    }

    return saved;
  },

  // --- CALCULATIONS (Preserved exact ChitWise business logic) ---
  monthlyComm(chit) {
    if (chit.commType === 'percent') {
      return (chit.value * chit.commVal) / 100;
    }
    return chit.commVal;
  },

  auctionDividend(chit, auction) {
    const comm = auction.comm || this.monthlyComm(chit);
    const pool = auction.bid - comm;
    return pool > 0 ? pool / chit.members : 0;
  },

  dividendsEarned(chit, upToMonth, auctions = []) {
    let total = 0;
    auctions.forEach(a => {
      if (a.month <= upToMonth) {
        if (chit.taken && a.month >= chit.takenMonth) return;
        total += this.auctionDividend(chit, a);
      }
    });
    return total;
  },

  actualPayable(chit, month, auctions = []) {
    if (chit.taken && month >= chit.takenMonth) {
      return chit.monthly;
    }
    const auction = auctions.find(a => a.month === month);
    if (!auction) return chit.monthly;
    const div = this.auctionDividend(chit, auction);
    return Math.max(0, chit.monthly - div);
  },

  totalPaid(chit, auctions = []) {
    let total = 0;
    for (let m = 1; m <= chit.currentMonth; m++) {
      total += this.actualPayable(chit, m, auctions);
    }
    return total;
  },

  expectedFinalPL(chit, auctions = []) {
    const paid = this.totalPaid(chit, auctions);
    const divs = this.dividendsEarned(chit, chit.currentMonth, auctions);
    const recv = chit.taken ? chit.takenAmount : (chit.value * 0.92); // conservative fallback if not taken
    return recv + divs - (chit.duration * chit.monthly);
  },

  simulateBid(chit, month, bid, auctions = []) {
    const comm = this.monthlyComm(chit);
    const received = chit.value - bid;
    let paidNow = 0;
    for (let m = 1; m <= month; m++) {
      paidNow += this.actualPayable(chit, m, auctions);
    }
    const future = (chit.duration - month) * chit.monthly;
    const divs = this.dividendsEarned(chit, month - 1, auctions);
    const net = received + divs - paidNow - future;
    const retPct = paidNow > 0 ? (net / paidNow) * 100 : 0;

    return { received, paidNow, future, divs, net, retPct, comm };
  },

  bestMonth(chit, auctions = []) {
    let best = { month: 1, net: -Infinity };
    const avgBid = auctions.length
      ? auctions.reduce((s, a) => s + a.bid, 0) / auctions.length
      : chit.value * 0.08;

    for (let m = 1; m <= chit.duration; m++) {
      const sim = this.simulateBid(chit, m, avgBid, auctions);
      if (sim.net > best.net) best = { month: m, net: sim.net };
    }
    return best;
  },

  // --- UNIFIED LEDGER INTEGRATION (Duplicate-Safe) ---
  async recordChitPayment(chitId, month, amount, dateStr = null) {
    const chit = await this.getChitById(chitId);
    if (!chit) return null;

    const paymentDate = dateStr || new Date().toISOString().slice(0, 10);
    const deterministicSourceId = `chit_pay_${chitId}_m${month}`;

    // 1. Save chit_payment record
    const payRecord = await Repository.save(STORE_PAYMENTS, {
      id: deterministicSourceId,
      chitId,
      month: parseInt(month),
      amount: parseFloat(amount),
      date: paymentDate,
      status: 'paid'
    });

    // 2. Idempotent check for linked transaction
    const allTxns = await TransactionService.getAllTransactions();
    const existingTx = allTxns.find(t => t.sourceId === deterministicSourceId);

    const txPayload = {
      id: existingTx ? existingTx.id : undefined,
      type: 'expense',
      amount: parseFloat(amount),
      category: 'Chit Fund',
      date: paymentDate,
      description: `${chit.name} — Month ${month} Installment`,
      notes: `Chit payment recorded via ChitWise`,
      paymentMethod: 'Bank Transfer',
      sourceType: 'chit',
      sourceId: deterministicSourceId
    };

    if (existingTx) {
      await TransactionService.updateTransaction(existingTx.id, txPayload);
    } else {
      await TransactionService.addTransaction(txPayload);
    }

    return payRecord;
  },

  async recordChitPayout(chitId, month, amountReceived, dateStr = null) {
    const chit = await this.getChitById(chitId);
    if (!chit) return null;

    const payoutDate = dateStr || new Date().toISOString().slice(0, 10);
    const amount = parseFloat(amountReceived);
    const deterministicSourceId = `chit_payout_${chitId}_m${month}`;

    // 1. Update chit state
    await this.updateChit(chitId, {
      taken: true,
      takenMonth: parseInt(month),
      takenAmount: amount
    });

    // 2. Idempotent check for linked transaction
    const allTxns = await TransactionService.getAllTransactions();
    const existingTx = allTxns.find(t => t.sourceId === deterministicSourceId);

    const txPayload = {
      id: existingTx ? existingTx.id : undefined,
      type: 'income',
      amount: amount,
      category: 'Chit Fund',
      date: payoutDate,
      description: `${chit.name} — Payout Received (Month ${month})`,
      notes: `Chit payout received via ChitWise`,
      paymentMethod: 'Bank Transfer',
      sourceType: 'chit',
      sourceId: deterministicSourceId
    };

    if (existingTx) {
      await TransactionService.updateTransaction(existingTx.id, txPayload);
    } else {
      await TransactionService.addTransaction(txPayload);
    }

    return true;
  }
};
