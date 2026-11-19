import mongoose from 'mongoose';
const lotSchema = new mongoose.Schema({
  lotNumber: { type: String, required: true, trim: true, index: true },
  farmerName: { type: String, required: true, trim: true },
  commodity: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'quintal' },
  status: { type: String, enum: ['received','in_auction','sold','weighed','dispatched','cancelled'], default: 'received', index: true },
  arrivalDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
lotSchema.index({ lotNumber: 1 }, { unique: true });
export default mongoose.model('Lot', lotSchema);