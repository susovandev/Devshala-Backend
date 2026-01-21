/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, Document } from 'mongoose';

enum NotificationType {
  NEW_USER = 'NEW_USER',
  NEW_BLOG = 'NEW_BLOG',
  BLOG_APPROVED = 'BLOG_APPROVED',
  BLOG_REJECTED = 'BLOG_REJECTED',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
}
export interface INotificationDocument extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  data: {
    blogId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    message: { type: String, required: true },
    data: {
      blogId: { type: Schema.Types.ObjectId, ref: 'Blog' },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<INotificationDocument>('Notification', notificationSchema);
