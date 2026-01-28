// /* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from 'mongoose';

// declare module 'mongoose' {
//   interface AggregatePaginateModel<T> extends mongoose.Model<T> {
//     aggregatePaginate(
//       aggregate: mongoose.Aggregate<any>,
//       options?: {
//         page?: number;
//         limit?: number;
//         sort?: any;
//         populate?: any;
//       }
//     ): Promise<{
//       docs: T[];
//       totalDocs: number;
//       limit: number;
//       page?: number;
//       totalPages: number;
//       hasNextPage: boolean;
//       hasPrevPage: boolean;
//       nextPage?: number;
//       prevPage?: number;
//     }>;
//   }
// }
