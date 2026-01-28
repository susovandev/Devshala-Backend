import mongoose, { Schema, model, Document } from 'mongoose';

export interface IAuthorRequest extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const authorRequestSchema = new Schema<IAuthorRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export default model<IAuthorRequest>('AuthorRequest', authorRequestSchema);
