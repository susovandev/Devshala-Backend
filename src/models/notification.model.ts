/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, Document, AggregatePaginateModel } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum NotificationType {
  NEW_USER = 'NEW_USER',
  BLOG_CREATED = 'BLOG_CREATED',
  NEW_BLOG = 'NEW_BLOG',
  BLOG_APPROVED = 'BLOG_APPROVED',
  BLOG_REJECTED = 'BLOG_REJECTED',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  BOOKMARK = 'BOOKMARK',
  AUTHOR_REQUEST = 'AUTHOR_REQUEST',
}
export interface INotificationDocument extends Document {
  recipientId: mongoose.Types.ObjectId; // The user who will receive the notification
  actorId: mongoose.Types.ObjectId; // The user who triggered the notification
  type: NotificationType;
  message: string;
  blogId: mongoose.Types.ObjectId;
  redirectUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    message: { type: String, required: true },
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog' },
    redirectUrl: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.plugin(aggregatePaginate);

export default model<INotificationDocument, AggregatePaginateModel<INotificationDocument>>(
  'Notification',
  notificationSchema,
);
