import mongoose, { Schema, model, Document, AggregatePaginateModel } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface IBookmarkDocument extends Document {
  userId: mongoose.Types.ObjectId;
  blogId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkSchema = new Schema<IBookmarkDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  },
  { timestamps: true },
);

bookmarkSchema.index({ userId: 1, blogId: 1 });

bookmarkSchema.plugin(aggregatePaginate);

export default model<IBookmarkDocument, AggregatePaginateModel<IBookmarkDocument>>(
  'Bookmark',
  bookmarkSchema,
);
