import mongoose from 'mongoose';
import { toJSONPlugin, toObjectPlugin } from './plugins';

const { Schema } = mongoose;
const wordSchema = new Schema({
  word: { type: String, required: true },
  wordClass: { type: String, default: '' },
  definitions: { type: [{ type: String }], default: [] },
  variations: { type: [{ type: String }], default: [] },
  normalized: { type: String, default: '' },
  frequency: { type: Number },
  stems: { type: [{ type: String }], default: [] },
}, { toObject: toObjectPlugin });

toJSONPlugin(wordSchema);

export default mongoose.model('Word', wordSchema);
