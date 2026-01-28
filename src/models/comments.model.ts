/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, Document, AggregatePaginateModel } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum CommentStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  REMOVED = 'REMOVED',
}
export interface ICommentDocument extends Document {
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  status: CommentStatus;
  moderation: {
    reason?: string;
    moderatedBy?: mongoose.Types.ObjectId;
    moderatedAt?: Date;
  };
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<ICommentDocument>(
  {
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(CommentStatus),
      default: CommentStatus.ACTIVE,
      index: true,
    },
    moderation: {
      reason: String,
      moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      moderatedAt: Date,
    },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

commentSchema.plugin(aggregatePaginate);

export default model<ICommentDocument, AggregatePaginateModel<ICommentDocument>>(
  'Comment',
  commentSchema,
);
