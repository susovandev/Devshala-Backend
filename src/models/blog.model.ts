/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, Document, AggregatePaginateModel } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum BlogApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
export interface IBlogDocument extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: mongoose.Types.ObjectId;
  publisherId: mongoose.Types.ObjectId;
  categories: mongoose.Types.ObjectId[];
  tags: string[];
  coverImage: {
    publicId: string;
    url: string;
  };
  status: {
    adminApproved: boolean | undefined;
    adminApprovedAt: Date;
    adminApprovalStatus: BlogApprovalStatus | undefined;
    adminIsPublished: boolean | undefined;
    adminRejectionReason: string | undefined;
    rejectedBy: {
      admin?: mongoose.Types.ObjectId;
      publisher?: mongoose.Types.ObjectId;
    };
    publisherApproved: boolean | undefined;
    publisherApprovedAt: Date;
    publisherApprovalStatus: BlogApprovalStatus | undefined;
    publisherIsPublished: boolean | undefined;
    publisherRejectionReason: string | undefined;
  };
  stats: {
    views: number;
  };
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlogDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publisherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
    ],
    tags: [String],
    coverImage: {
      publicId: String,
      url: String,
    },
    status: {
      adminApproved: {
        type: Boolean,
        default: false,
      },
      publisherApproved: {
        type: Boolean,
        default: false,
      },
      adminApprovedAt: Date,
      publisherApprovedAt: Date,
      adminApprovalStatus: {
        type: String,
        enum: Object.values(BlogApprovalStatus),
        default: BlogApprovalStatus.PENDING,
      },
      publisherApprovalStatus: {
        type: String,
        enum: Object.values(BlogApprovalStatus),
        default: BlogApprovalStatus.PENDING,
      },
      adminIsPublished: {
        type: Boolean,
        default: false,
      },
      publisherIsPublished: {
        type: Boolean,
        default: false,
      },
      adminRejectionReason: {
        type: String,
      },
      publisherRejectionReason: {
        type: String,
      },
      rejectedBy: {
        admin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        publisher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    },
    stats: {
      views: {
        type: Number,
        default: 0,
      },
    },
    publishedAt: Date,
  },
  { timestamps: true },
);

blogSchema.index({
  'status.adminApprovalStatus': 1,
  'status.publisherApprovalStatus': 1,
  'status.adminIsPublished': 1,
  'status.publisherIsPublished': 1,
  createdAt: -1,
});

blogSchema.plugin(aggregatePaginate);

export default model<IBlogDocument, AggregatePaginateModel<IBlogDocument>>('Blog', blogSchema);
