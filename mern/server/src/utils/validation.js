import mongoose from 'mongoose';
export const isId = value => mongoose.isValidObjectId(value);
export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
