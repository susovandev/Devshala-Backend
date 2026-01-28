import { Schema, Document, model } from 'mongoose';

export interface ISubscribeDocument extends Document {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscribeSchema = new Schema<ISubscribeDocument>(
  {
    email: { type: String, required: true },
  },
  { timestamps: true },
);

subscribeSchema.index({ email: 1 }, { unique: true });

export default model<ISubscribeDocument>('Subscribe', subscribeSchema);
