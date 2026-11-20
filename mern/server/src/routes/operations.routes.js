import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { calculateWeighment, calculateBill, outstandingBalance, roundMoney, isGatePassEligible } from '../domain/yardRules.js';
import User from '../models/User.js';
import Lot from '../models/Lot.js';
import {
  Buyer, AuctionTicket, Weighment, SaleBill, Payment, GatePass,
  Complaint, AuditLog, YardConfig, Counter
} from '../models/Operations.js';

const router = Router();
router.use(requireAuth);

const fail = (status, message) => Object.assign(new Error(message), { status });
const isId = value => mongoose.isValidObjectId(value);
const addDays = (date, days) => new Date(new Date(date).getTime() + Number(days || 0) * 86400000);
const dateKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: '2-digit', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('-', '');
const nextNumber = async key => {
  const row = await Counter.findOneAndUpdate({ _id: key }, { $inc: { value: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return row.value;
};
const config = async () => YardConfig.findOneAndUpdate({ key: 'yard' }, { $setOnInsert: { key: 'yard' } }, { new: true, upsert: true, setDefaultsOnInsert: true });
const audit = async (req, action, resource, resourceId, before = null, after = null, reason = '') => {
  await AuditLog.create({
    actor: req.user._id, actorName: req.user.name, role: req.user.role, action, resource,
    resourceId: String(resourceId || ''), before, after, reason, ipAddress: req.ip
  });
};
const sessionRun = async work => {
  const session = await mongoose.startSession();
  try { let value; await session.withTransaction(async () => { value = await work(session); }); return value; }
  finally { await session.endSession(); }
};
const cleanPage = req => ({
  page: Math.max(1, Number(req.query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(req.query.limit) || 25))
});

router.get('/overview', async (req, res, next) => {
  try {
    const [totalLots, arrived, auctioned, weighed, dispatched, totalTickets, totalBills, totalComplaints, openComplaints, farmerRows, buyers] = await Promise.all([
      Lot.countDocuments(), Lot.countDocuments({ status: 'arrived' }), Lot.countDocuments({ status: 'auctioned' }),
      Lot.countDocuments({ status: 'weighed' }), Lot.countDocuments({ status: 'dispatched' }),
      AuctionTicket.countDocuments({ voidedAt: null }), SaleBill.countDocuments({ status: { $ne: 'cancelled' } }),
      Complaint.countDocuments(), Complaint.countDocuments({ status: { $in: ['open','investigating'] } }),
      SaleBill.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: {
        _id: null, payable: { $sum: '$farmerNetPayable' }, paid: { $sum: '$farmerPaid' },
        traderGross: { $sum: '$grossAmount' }, traderPaid: { $sum: '$buyerPurchasePaid' },
        buyerDues: { $sum: { $add: ['$buyerMarketFee', '$buyerOtherDues'] } }, buyerDuesPaid: { $sum: '$buyerDuesPaid' }
      } }]),
      Buyer.countDocuments({ active: true })
    ]);
    const totals = farmerRows[0] || {};
    res.json({ stats: {
      totalLots, arrived, auctioned, weighed, dispatched, totalTickets, totalBills,
      totalComplaints, openComplaints, activeBuyers: buyers,
      farmerPayable: roundMoney(totals.payable || 0), farmerPaid: roundMoney(totals.paid || 0),
      farmerDue: roundMoney((totals.payable || 0) - (totals.paid || 0)),
      traderPurchase: roundMoney(totals.traderGross || 0), traderCollected: roundMoney(totals.traderPaid || 0),
      traderDue: roundMoney((totals.traderGross || 0) - (totals.traderPaid || 0)),
      buyerDues: roundMoney(totals.buyerDues || 0), buyerDuesPaid: roundMoney(totals.buyerDuesPaid || 0)
    }, role: req.user.role });
  } catch (error) { next(error); }
});

// Gate entries / lots
router.get('/lots', async (req, res, next) => {
  try {
    const { page, limit } = cleanPage(req);
    const filter = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.search) {
      const term = String(req.query.search).trim().slice(0, 80);
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['lotNumber','farmerName','mobile','commodity','vehicle','village'].map(key => ({ [key]: { $regex: safe, $options: 'i' } }));
    }
    if (req.query.from || req.query.to) {
      filter.arrivalAt = {};
      if (req.query.from) filter.arrivalAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.arrivalAt.$lte = new Date(req.query.to);
    }
    const [items, total] = await Promise.all([
      Lot.find(filter).populate('buyerId','name registrationNo').populate('createdBy','name role')
        .sort({ arrivalAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Lot.countDocuments(filter)
    ]);
    res.json({ items, total, page, limit });
  } catch (error) { next(error); }
});

router.post('/lots', allowRoles('admin','gate'), async (req, res, next) => {
  try {
    const v = req.body || {};
    const required = ['farmerName','commodity'];
    for (const key of required) if (!String(v[key] || '').trim()) throw fail(400, key + ' is required');
    if (v.sellerType === 'trader' && !String(v.traderRegistrationNo || '').trim()) throw fail(400, 'Trader registration / licence ID is required for trader sellers');
    const bags = Number(v.bags);
    if (!Number.isInteger(bags) || bags < 1) throw fail(400, 'Bags must be a positive whole number');
    if (v.mobile && !/^[0-9 +()-]{8,18}$/.test(v.mobile)) throw fail(400, 'Enter a valid contact number');
    const cfg = await config();
    if (!cfg.commodities.includes(v.commodity)) throw fail(400, 'Select a commodity from the approved master list');
    const lotNumber = `LOT-${dateKey()}-${String(await nextNumber('lot-' + dateKey())).padStart(4,'0')}`;
    const item = await Lot.create({
      lotNumber, sellerType: v.sellerType === 'trader' ? 'trader' : 'farmer',
      farmerName: String(v.farmerName).trim(), mobile: String(v.mobile || '').trim(),
      farmerRegistryId: String(v.farmerRegistryId || '').trim(), landRecordType: String(v.landRecordType || '').trim(),
      landRecordNo: String(v.landRecordNo || '').trim(), traderRegistrationNo: String(v.traderRegistrationNo || '').trim(),
      state: String(v.state || 'Gujarat').trim(), district: String(v.district || '').trim(),
      taluka: String(v.taluka || '').trim(), village: String(v.village || '').trim(), commodity: v.commodity,
      bags, vehicle: String(v.vehicle || '').trim().toUpperCase(), estimated: Math.max(0, Number(v.estimated || 0)),
      quality: String(v.quality || 'FAQ').trim(), notes: String(v.notes || '').trim(), createdBy: req.user._id
    });
    await audit(req, 'GATE_ENTRY_CREATED', 'Lot', item._id, null, { lotNumber, farmerName: item.farmerName, commodity: item.commodity });
    res.status(201).json({ item });
  } catch (error) { next(error); }
});

router.get('/lots/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) throw fail(400, 'Invalid lot ID');
    const item = await Lot.findById(req.params.id).populate('buyerId','name registrationNo').populate('createdBy','name role').lean();
    if (!item) throw fail(404, 'Lot not found');
    const [ticket, weighments, bill, pass, complaints] = await Promise.all([
      AuctionTicket.findOne({ lot: item._id, voidedAt: null }).populate('buyer','name registrationNo').lean(),
      Weighment.find({ lot: item._id }).populate('recordedBy','name').sort({ createdAt: 1 }).lean(),
      SaleBill.findOne({ lot: item._id }).populate('buyer','name registrationNo').lean(),
      GatePass.findOne({ lot: item._id }).lean(),
      Complaint.find({ lot: item._id }).sort({ createdAt: -1 }).lean()
    ]);
    res.json({ item, ticket, weighments, bill, pass, complaints });
  } catch (error) { next(error); }
});

// Buyer master and credit
router.get('/buyers', async (req, res, next) => {
  try {
    const filter = {};
    const { page, limit } = cleanPage(req);
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    const searchTerm = String(req.query.search || '').trim().slice(0, 80);
    const safeSearch = Array.from(searchTerm).filter(ch => { const cp = ch.codePointAt(0); return /[A-Za-z0-9 _-]/.test(ch) || (cp >= 0x0A80 && cp <= 0x0AFF); }).join('');
    if (safeSearch) filter.name = { $regex: safeSearch, $options: 'i' };
    const [items, total] = await Promise.all([
      Buyer.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Buyer.countDocuments(filter)
    ]);
    const bills = await SaleBill.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: {
      _id: '$buyer', gross: { $sum: '$grossAmount' }, paid: { $sum: '$buyerPurchasePaid' },
      dueFees: { $sum: { $subtract: [{ $add: ['$buyerMarketFee','$buyerOtherDues'] }, '$buyerDuesPaid'] } }
    } }]);
    const balances = new Map(bills.map(x => [String(x._id), x]));
    res.json({ items: items.map(x => ({ ...x, ledger: balances.get(String(x._id)) || { gross: 0, paid: 0, dueFees: 0 } })), total, page, limit });
  } catch (error) { next(error); }
});
router.post('/buyers', allowRoles('admin','accounts'), async (req, res, next) => {
  try {
    const { name, registrationNo, creditDays, purchaseLimit, notes } = req.body || {};
    if (!String(name || '').trim() || !String(registrationNo || '').trim()) throw fail(400, 'Trader name and registration ID are required');
    const item = await Buyer.create({ name: name.trim(), registrationNo: registrationNo.trim(),
      creditDays: Number(creditDays ?? 5), purchaseLimit: Number(purchaseLimit ?? 0), notes });
    await audit(req, 'BUYER_CREATED', 'Buyer', item._id, null, { name: item.name, registrationNo: item.registrationNo });
    res.status(201).json({ item });
  } catch (error) { if (error.code === 11000) return next(fail(409, 'A buyer with this name already exists')); next(error); }
});
router.patch('/buyers/:id', allowRoles('admin','accounts'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) throw fail(400, 'Invalid buyer ID');
    const before = await Buyer.findById(req.params.id);
    if (!before) throw fail(404, 'Buyer not found');
    const allowed = ['name','registrationNo','creditDays','purchaseLimit','notes','active'];
    for (const key of allowed) if (req.body[key] !== undefined) before[key] = req.body[key];
    await before.save();
    await audit(req, 'BUYER_UPDATED', 'Buyer', before._id, { name: before.name }, { name: before.name, registrationNo: before.registrationNo });
    res.json({ item: before });
  } catch (error) { next(error); }
});

// Auction price ticket, including real buyer credit validation
router.get('/tickets', async (req, res, next) => {
  try {
    const filter = { voidedAt: null };
    const { page, limit } = cleanPage(req);
    const items = await AuctionTicket.find(filter).populate('lot').populate('buyer','name registrationNo creditDays purchaseLimit').populate('issuedBy','name')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
    const total = await AuctionTicket.countDocuments(filter);
    res.json({ items, total, page, limit });
  } catch (error) { next(error); }
});
router.post('/tickets', allowRoles('admin','auction'), async (req, res, next) => {
  try {
    const { lotId, buyerId, rate, quantity, quality, method, notes } = req.body || {};
    if (!isId(lotId) || !isId(buyerId)) throw fail(400, 'Select a valid lot and buyer');
    const price = Number(rate), qty = Number(quantity);
    if (!(price > 0) || !(qty > 0)) throw fail(400, 'Auction rate and quantity must be positive');
    const lot = await Lot.findById(lotId);
    if (!lot || lot.status !== 'arrived') throw fail(409, 'Lot is not available for auction');
    if (qty > Number(lot.estimated || 0) && Number(lot.estimated || 0) > 0) throw fail(400, 'Auction quantity cannot exceed estimated quantity');
    const buyer = await Buyer.findById(buyerId);
    if (!buyer || !buyer.active) throw fail(404, 'Active registered buyer not found');
    const bills = await SaleBill.find({ buyer: buyer._id, status: { $ne: 'cancelled' } });
    const outstanding = bills.reduce((sum, b) => sum + Math.max(0, b.grossAmount - b.buyerPurchasePaid), 0);
    const overdueBalance = bills.some(b => b.grossAmount > b.buyerPurchasePaid && b.buyerCreditDueAt && b.buyerCreditDueAt < new Date());
    const activeTickets = await AuctionTicket.find({ buyer: buyer._id, voidedAt: null });
    let pendingExposure = 0;
    for (const t of activeTickets) {
      const relatedLot = await Lot.findById(t.lot).select('billId status');
      if (relatedLot && !relatedLot.billId && relatedLot.status !== 'dispatched') pendingExposure += t.quantity * t.rate;
    }
    const exposure = outstanding + pendingExposure;
    if (overdueBalance) throw fail(409, 'Buyer is on credit hold: overdue purchase balance must be settled first');
    if (buyer.purchaseLimit > 0 && exposure + qty * price > buyer.purchaseLimit) throw fail(409, 'This bid would exceed the buyer purchase credit limit');
    const cfg = await config();
    const issuedAt = new Date();
    const ticketNumber = `${cfg.ticketPrefix}-${issuedAt.getFullYear()}-${String(await nextNumber('ticket-' + issuedAt.getFullYear())).padStart(6,'0')}`;
    const ticket = await sessionRun(async session => {
      const created = await AuctionTicket.create([{
        ticketNumber, lot: lot._id, buyer: buyer._id, quantity: qty, rate: price,
        quality: String(quality || lot.quality), method: ['open_outcry','e_auction','approved_negotiated'].includes(method) ? method : 'open_outcry',
        notes: String(notes || ''), buyerCreditDays: buyer.creditDays,
        farmerPaymentDueAt: addDays(issuedAt, cfg.farmerPaymentDays),
        dispatchDueAt: addDays(issuedAt, cfg.dispatchDays),
        buyerCreditDueAt: addDays(issuedAt, buyer.creditDays), issuedBy: req.user._id
      }], { session });
      await Lot.updateOne({ _id: lot._id, status: 'arrived' }, {
        $set: { status: 'auctioned', ticketId: created[0]._id, buyerId: buyer._id, auctionRate: price }
      }, { session });
      return created[0];
    });
    await audit(req, 'AUCTION_TICKET_ISSUED', 'AuctionTicket', ticket._id, null, { ticketNumber, lotNumber: lot.lotNumber, buyer: buyer.name, rate: price, quantity: qty });
    res.status(201).json({ item: ticket });
  } catch (error) { next(error); }
});
router.post('/tickets/:id/void', allowRoles('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) throw fail(400, 'Invalid ticket ID');
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 8) throw fail(400, 'Provide a correction / cancellation reason (at least 8 characters)');
    const ticket = await AuctionTicket.findById(req.params.id);
    if (!ticket || ticket.voidedAt) throw fail(404, 'Active ticket not found');
    const lot = await Lot.findById(ticket.lot);
    if (!lot || lot.billId) throw fail(409, 'A ticket linked to a sale bill cannot be voided');
    ticket.voidedAt = new Date(); ticket.voidReason = reason; await ticket.save();
    lot.status = 'arrived'; lot.ticketId = null; lot.buyerId = null; lot.auctionRate = null; await lot.save();
    await audit(req, 'AUCTION_TICKET_VOIDED', 'AuctionTicket', ticket._id, { ticketNumber: ticket.ticketNumber }, null, reason);
    res.json({ item: ticket });
  } catch (error) { next(error); }
});

// Weighbridge, immutable readings and sale bill creation/update
router.get('/weighments', async (req, res, next) => {
  try {
    const { page, limit } = cleanPage(req);
    const [items, total] = await Promise.all([
      Weighment.find().populate('lot','lotNumber farmerName commodity vehicle').populate('recordedBy','name').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
      Weighment.countDocuments()
    ]);
    res.json({ items, total, page, limit });
  } catch (error) { next(error); }
});
router.post('/weighments', allowRoles('admin','weighment'), async (req, res, next) => {
  try {
    const { lotId, gross, tare, scaleId, slipRef, notes, correctionReason } = req.body || {};
    if (!isId(lotId)) throw fail(400, 'Select a valid lot');
    let weight;
    try { weight = calculateWeighment(gross, tare); }
    catch (error) { throw fail(400, error.message); }
    const { gross: grossValue, tare: tareValue, net } = weight;
    const lot = await Lot.findById(lotId);
    if (!lot || !['auctioned','weighed'].includes(lot.status)) throw fail(409, 'Only an auctioned lot can be weighed');
    const prior = await Weighment.findOne({ lot: lot._id }).sort({ createdAt: -1 });
    const oldBill = lot.billId ? await SaleBill.findById(lot.billId) : null;
    if (prior) {
      if (req.user.role !== 'admin' || String(correctionReason || '').trim().length < 8) throw fail(409, 'A prior weighment exists. Only an administrator can record a correction with a reason');
      if (oldBill && (oldBill.farmerPaid > 0 || oldBill.buyerPurchasePaid > 0 || oldBill.buyerDuesPaid > 0)) throw fail(409, 'Payment has been recorded; bill correction requires an approved accounting adjustment workflow');
    }
    const ticket = await AuctionTicket.findOne({ _id: lot.ticketId, voidedAt: null }).populate('buyer');
    if (!ticket) throw fail(409, 'Active auction ticket not found');
    const cfg = await config();
    const weightRecord = await sessionRun(async session => {
      const created = await Weighment.create([{
        lot: lot._id, gross: grossValue, tare: tareValue, net, scaleId, slipRef, notes,
        recordedBy: req.user._id, correctionOf: prior?._id || null, correctionReason: String(correctionReason || '')
      }], { session });
      const billAmounts = calculateBill({
        netWeight: net, rate: ticket.rate,
        sellerDeduction: cfg.sellerApprovedDeduction || 0,
        buyerMarketFee: cfg.buyerMarketFee || 0,
        buyerOtherDues: cfg.buyerOtherDues || 0
      });
      const billData = {
        lot: lot._id, ticket: ticket._id, buyer: ticket.buyer._id, farmerName: lot.farmerName,
        commodity: lot.commodity, netWeight: net, rate: ticket.rate, ...billAmounts,
        farmerPaymentDueAt: ticket.farmerPaymentDueAt, dispatchDueAt: ticket.dispatchDueAt, buyerCreditDueAt: ticket.buyerCreditDueAt
      };
      let bill;
      if (oldBill) {
        oldBill.set(billData); await oldBill.save({ session }); bill = oldBill;
      } else {
        const billNumber = `${cfg.billPrefix}-${new Date().getFullYear()}-${String(await nextNumber('bill-' + new Date().getFullYear())).padStart(6,'0')}`;
        const createdBill = await SaleBill.create([{ ...billData, billNumber, status: billData.farmerNetPayable <= 0 ? 'paid' : 'payment_pending' }], { session }); bill = createdBill[0];
      }
      await Lot.updateOne({ _id: lot._id }, { $set: {
        status: (Number(oldBill?.farmerPaid || 0) >= Number(billData.farmerNetPayable || 0)) ? 'paid' : 'weighed',
        grossWeight: grossValue, tareWeight: tareValue, netWeight: net,
        scaleId, slipRef, billId: bill._id
      } }, { session });
      return { weighment: created[0], bill };
    });
    await audit(req, prior ? 'WEIGHMENT_CORRECTED' : 'WEIGHMENT_RECORDED', 'Weighment', weightRecord.weighment._id, prior ? { gross: prior.gross, tare: prior.tare, net: prior.net } : null, { gross: grossValue, tare: tareValue, net }, String(correctionReason || ''));
    res.status(prior ? 200 : 201).json({ item: weightRecord.weighment, bill: weightRecord.bill });
  } catch (error) { next(error); }
});

// Bills and all three separate payment ledgers
router.get('/bills', async (req, res, next) => {
  try {
    const { page, limit } = cleanPage(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const safe = String(req.query.search).trim().slice(0,80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ billNumber: { $regex: safe, $options: 'i' } }, { farmerName: { $regex: safe, $options: 'i' } }];
    }
    const [items,total] = await Promise.all([
      SaleBill.find(filter).populate('buyer','name registrationNo').populate('lot','lotNumber vehicle').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),
      SaleBill.countDocuments(filter)
    ]);
    res.json({ items,total,page,limit });
  } catch (error) { next(error); }
});
router.get('/payments', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const { page, limit } = cleanPage(req);
    const [items,total] = await Promise.all([
      Payment.find(filter).populate('bill','billNumber farmerName').populate('lot','lotNumber').populate('recordedBy','name').sort({receivedAt:-1}).skip((page-1)*limit).limit(limit).lean(),
      Payment.countDocuments(filter)
    ]);
    res.json({ items,total,page,limit });
  } catch (error) { next(error); }
});
router.post('/payments', allowRoles('admin','accounts'), async (req, res, next) => {
  try {
    const { billId, type, amount, mode, reference, notes } = req.body || {};
    if (!isId(billId)) throw fail(400, 'Select a valid sale bill');
    if (!['farmer_settlement','buyer_purchase','buyer_fee'].includes(type)) throw fail(400, 'Invalid payment ledger type');
    const value = outstandingBalance(Number(amount), 0);
    if (!(value > 0)) throw fail(400, 'Payment amount must be greater than zero');
    if (!['NEFT','RTGS','IMPS','UPI','BANK_TRANSFER','CASH_APPROVED'].includes(mode)) throw fail(400, 'Select a valid payment mode');
    if (mode === 'CASH_APPROVED' && req.user.role !== 'admin') throw fail(403, 'Cash receipt requires administrator approval');
    if (String(reference || '').trim().length < 4) throw fail(400, 'Bank UTR / receipt reference is required');
    const result = await sessionRun(async session => {
      const bill = await SaleBill.findById(billId).session(session);
      if (!bill || bill.status === 'cancelled') throw fail(404, 'Active sale bill not found');
      const field = type === 'farmer_settlement' ? 'farmerPaid' : type === 'buyer_purchase' ? 'buyerPurchasePaid' : 'buyerDuesPaid';
      const totalDue = type === 'farmer_settlement' ? bill.farmerNetPayable :
        type === 'buyer_purchase' ? bill.grossAmount : bill.buyerMarketFee + bill.buyerOtherDues;
      const outstanding = outstandingBalance(totalDue, bill[field]);
      if (value > outstanding + 0.001) throw fail(409, 'Payment exceeds outstanding balance of ₹' + outstanding);
      bill[field] = roundMoney(bill[field] + value);
      if (type === 'farmer_settlement') {
        bill.status = bill.farmerPaid >= bill.farmerNetPayable - 0.01 ? 'paid' : 'part_paid';
        if (bill.status === 'paid') await Lot.updateOne({ _id: bill.lot }, { $set: { status: 'paid' } }, { session });
      }
      await bill.save({ session });
      const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(await nextNumber('receipt-' + new Date().getFullYear())).padStart(7,'0')}`;
      const records = await Payment.create([{
        receiptNumber, bill: bill._id, lot: bill.lot, type, amount: value, mode,
        reference: String(reference).trim(), notes, recordedBy: req.user._id
      }], { session });
      return { bill, payment: records[0], outstanding: outstandingBalance(outstanding, value) };
    });
    await audit(req, 'PAYMENT_RECORDED', 'Payment', result.payment._id, null, {
      receiptNumber: result.payment.receiptNumber, bill: result.bill.billNumber, type, amount: value, mode
    });
    res.status(201).json(result);
  } catch (error) { if (error.code === 11000) return next(fail(409, 'This payment reference has already been recorded for this ledger')); next(error); }
});

// Gate pass and physical exit
router.get('/gate-passes', async (req, res, next) => {
  try {
    const { page, limit } = cleanPage(req);
    const [items, total] = await Promise.all([
      GatePass.find().populate('lot','lotNumber farmerName commodity netWeight vehicle status')
        .populate('buyer','name registrationNo').populate('issuedBy','name').populate('dispatchedBy','name')
        .sort({ issuedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      GatePass.countDocuments()
    ]);
    res.json({ items, total, page, limit });
  } catch (error) { next(error); }
});
router.post('/gate-passes/:lotId/issue', allowRoles('admin','gate'), async (req, res, next) => {
  try {
    if (!isId(req.params.lotId)) throw fail(400, 'Invalid lot ID');
    const lot = await Lot.findById(req.params.lotId);
    if (!lot || lot.status !== 'paid' || !lot.billId) throw fail(409, 'Farmer settlement must be completed before issuing a gate pass');
    const bill = await SaleBill.findById(lot.billId).populate('buyer');
    if (!bill) throw fail(404, 'Sale bill not found');
    const eligibility = isGatePassEligible({
      farmerPayable: bill.farmerNetPayable,
      farmerPaid: bill.farmerPaid,
      buyerDues: bill.buyerMarketFee + bill.buyerOtherDues,
      buyerDuesPaid: bill.buyerDuesPaid,
      traderBalance: bill.grossAmount - bill.buyerPurchasePaid,
      traderDueAt: bill.buyerCreditDueAt
    });
    if (!eligibility.eligible) throw fail(409, eligibility.reason);
    const cfg = await config();
    const overdueDispatch = bill.dispatchDueAt && bill.dispatchDueAt < new Date();
    const overrideReason = String(req.body.overrideReason || '').trim();
    if (overdueDispatch && (req.user.role !== 'admin' || overrideReason.length < 8)) throw fail(409, 'Dispatch deadline is overdue. Administrator must provide an override reason');
    const passNumber = `${cfg.passPrefix}-${new Date().getFullYear()}-${String(await nextNumber('pass-' + new Date().getFullYear())).padStart(6,'0')}`;
    const item = await sessionRun(async session => {
      const created = await GatePass.create([{
        passNumber, lot: lot._id, bill: bill._id, vehicle: lot.vehicle, buyer: bill.buyer._id,
        issuedBy: req.user._id, overrideReason
      }], { session });
      await Lot.updateOne({ _id: lot._id, status: 'paid' }, { $set: { passNumber } }, { session });
      return created[0];
    });
    await audit(req, 'GATE_PASS_ISSUED', 'GatePass', item._id, null, { passNumber, lotNumber: lot.lotNumber }, overrideReason);
    res.status(201).json({ item });
  } catch (error) { if (error.code === 11000) return next(fail(409, 'A gate pass already exists for this lot')); next(error); }
});
router.post('/gate-passes/:id/dispatch', allowRoles('admin','gate'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) throw fail(400, 'Invalid gate pass ID');
    const item = await GatePass.findById(req.params.id);
    if (!item || item.status !== 'issued') throw fail(404, 'Issued gate pass not found');
    const result = await sessionRun(async session => {
      item.status = 'dispatched'; item.dispatchAt = new Date(); item.dispatchedBy = req.user._id; await item.save({ session });
      await Lot.updateOne({ _id: item.lot, status: 'paid', passNumber: item.passNumber }, { $set: { status: 'dispatched', dispatchAt: item.dispatchAt } }, { session });
      return item;
    });
    await audit(req, 'VEHICLE_EXIT_CONFIRMED', 'GatePass', item._id, { status: 'issued' }, { status: 'dispatched', dispatchAt: item.dispatchAt });
    res.json({ item: result });
  } catch (error) { next(error); }
});

// Grievance / dispute register
router.get('/complaints', async (req, res, next) => {
  try {
    const filter = {};
    const { page, limit } = cleanPage(req);
    if (req.query.status) filter.status = req.query.status;
    const [items, total] = await Promise.all([
      Complaint.find(filter).populate('lot','lotNumber farmerName').populate('assignedTo','name').populate('createdBy','name')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Complaint.countDocuments(filter)
    ]);
    res.json({ items, total, page, limit });
  } catch (error) { next(error); }
});
router.post('/complaints', allowRoles('admin','gate','auction','weighment','accounts','inspector'), async (req, res, next) => {
  try {
    const { complainant, mobile, type, lotId, details, evidenceReferences } = req.body || {};
    if (!String(complainant || '').trim() || !String(type || '').trim() || String(details || '').trim().length < 10) throw fail(400, 'Complainant, complaint type and detailed description are required');
    if (lotId && !isId(lotId)) throw fail(400, 'Invalid linked lot');
    const cfg = await config();
    const complaintNumber = `${cfg.complaintPrefix}-${new Date().getFullYear()}-${String(await nextNumber('complaint-' + new Date().getFullYear())).padStart(6,'0')}`;
    const item = await Complaint.create({
      complaintNumber, complainant: complainant.trim(), mobile, type, lot: lotId || null,
      details: details.trim(), evidenceReferences: (Array.isArray(evidenceReferences) ? evidenceReferences : String(evidenceReferences || '').split(/[\n,;]/)).map(x => String(x).trim()).filter(Boolean).slice(0,10),
      createdBy: req.user._id
    });
    await audit(req, 'COMPLAINT_REGISTERED', 'Complaint', item._id, null, { complaintNumber, type, lotId });
    res.status(201).json({ item });
  } catch (error) { next(error); }
});
router.patch('/complaints/:id', allowRoles('admin','inspector'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) throw fail(400, 'Invalid complaint ID');
    const item = await Complaint.findById(req.params.id);
    if (!item) throw fail(404, 'Complaint not found');
    const before = { status: item.status, resolution: item.resolution };
    if (req.body.status && !['open','investigating','resolved','rejected'].includes(req.body.status)) throw fail(400, 'Invalid complaint status');
    if (req.body.status) item.status = req.body.status;
    if (req.body.resolution !== undefined) item.resolution = String(req.body.resolution).trim();
    if (req.body.assignedTo) {
      if (!isId(req.body.assignedTo)) throw fail(400, 'Invalid assignee');
      item.assignedTo = req.body.assignedTo;
    }
    if (item.status === 'resolved' && !String(item.resolution || '').trim()) throw fail(400, 'A resolution note is required before closing a complaint');
    if (item.status === 'resolved') item.resolvedAt = new Date();
    await item.save();
    await audit(req, 'COMPLAINT_UPDATED', 'Complaint', item._id, before, { status: item.status, resolution: item.resolution });
    res.json({ item });
  } catch (error) { next(error); }
});

// Reports and management information
router.get('/reports/summary', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setHours(0,0,0,0));
    const to = req.query.to ? new Date(req.query.to) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw fail(400, 'Invalid report date range');
    const filter = { createdAt: { $gte: from, $lte: to } };
    const [lots,tickets,bills,payments,complaints] = await Promise.all([
      Lot.countDocuments({ arrivalAt: { $gte: from, $lte: to } }),
      AuctionTicket.countDocuments(filter),
      SaleBill.aggregate([{ $match: filter }, { $group: { _id:null, bills:{$sum:1}, gross:{$sum:'$grossAmount'}, farmerPayable:{$sum:'$farmerNetPayable'}, farmerPaid:{$sum:'$farmerPaid'} } }]),
      Payment.aggregate([{ $match: { receivedAt: { $gte: from, $lte: to } } }, { $group: { _id:'$type', amount:{$sum:'$amount'}, count:{$sum:1} } }]),
      Complaint.countDocuments(filter)
    ]);
    res.json({ from, to, lots, tickets, bills: bills[0] || { bills:0,gross:0,farmerPayable:0,farmerPaid:0 }, payments, complaints });
  } catch (error) { next(error); }
});

// Settings / master data
router.get('/settings', async (_req, res, next) => {
  try { res.json({ item: await config() }); } catch (error) { next(error); }
});
router.patch('/settings', allowRoles('admin'), async (req, res, next) => {
  try {
    const item = await config();
    const keys = ['committeeName','yardCode','timezone','ticketPrefix','billPrefix','passPrefix','complaintPrefix',
      'farmerPaymentDays','dispatchDays','defaultBuyerCreditDays','sellerApprovedDeduction','buyerMarketFee','buyerOtherDues','commodities'];
    const before = item.toObject();
    for (const key of keys) if (req.body[key] !== undefined) item[key] = req.body[key];
    if (!Array.isArray(item.commodities) || !item.commodities.length || item.commodities.some(x => !String(x).trim())) throw fail(400, 'At least one valid commodity is required');
    await item.save();
    await audit(req, 'YARD_SETTINGS_UPDATED', 'YardConfig', item._id, before, item.toObject());
    res.json({ item });
  } catch (error) { next(error); }
});

// Staff / user administration
router.get('/users', allowRoles('admin'), async (req, res, next) => {
  try {
    const { page, limit } = cleanPage(req);
    const [items, total] = await Promise.all([
      User.find().select('name email role active lastLoginAt createdAt').sort({ name: 1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments()
    ]);
    res.json({ items, total, page, limit });
  } catch (error) { next(error); }
});
router.post('/users', allowRoles('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!String(name || '').trim() || !String(email || '').trim() || !String(password || '').trim()) throw fail(400, 'Name, email and temporary password are required');
    if (String(password).length < 12) throw fail(400, 'Temporary password must be at least 12 characters');
    if (!['gate','auction','weighment','accounts','inspector','admin'].includes(role)) throw fail(400, 'Select a valid role');
    const passwordHash = await bcrypt.hash(password, 12);
    const item = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role });
    await audit(req, 'USER_CREATED', 'User', item._id, null, { name: item.name, email: item.email, role: item.role });
    res.status(201).json({ item: { id: item._id, name: item.name, email: item.email, role: item.role, active: item.active } });
  } catch (error) { if (error.code === 11000) return next(fail(409, 'A user with this email already exists')); next(error); }
});
router.patch('/users/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) throw fail(400, 'Invalid user ID');
    const item = await User.findById(req.params.id);
    if (!item) throw fail(404, 'User not found');
    if (String(item._id) === String(req.user._id) && (req.body.active === false || req.body.active === 'false')) throw fail(409, 'You cannot deactivate your own account');
    const before = { role: item.role, active: item.active };
    if (String(item._id) === String(req.user._id) && req.body.role !== undefined && req.body.role !== item.role) throw fail(409, 'You cannot change your own role');
    if (req.body.role !== undefined) {
      if (!['admin','gate','auction','weighment','accounts','inspector'].includes(req.body.role)) throw fail(400, 'Invalid role');
      item.role = req.body.role;
    }
    if (req.body.active !== undefined) item.active = req.body.active === true || req.body.active === 'true';
    if (req.body.password) {
      if (String(req.body.password).length < 12) throw fail(400, 'New password must be at least 12 characters');
      item.passwordHash = await bcrypt.hash(req.body.password, 12);
    }
    await item.save();
    await audit(req, 'USER_UPDATED', 'User', item._id, before, { role: item.role, active: item.active });
    res.json({ item: { id: item._id, name: item.name, email: item.email, role: item.role, active: item.active } });
  } catch (error) { if (error.code === 11000) return next(fail(409, 'A user with this email already exists')); next(error); }
});

// Permanent, append-only server audit log
router.get('/audit', allowRoles('admin','inspector'), async (req, res, next) => {
  try {
    const { page, limit } = cleanPage(req);
    const filter = {};
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.action) filter.action = req.query.action;
    const [items,total] = await Promise.all([
      AuditLog.find(filter).populate('actor','name email role').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),
      AuditLog.countDocuments(filter)
    ]);
    res.json({items,total,page,limit});
  } catch (error) { next(error); }
});

export default router;
