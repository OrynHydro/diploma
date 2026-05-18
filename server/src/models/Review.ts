import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IReview } from '@shared/interfaces/review.interface.js';

export interface IReviewDocument extends Omit<IReview, '_id' | 'user'>, Document {
    _id: Types.ObjectId;
    product: Types.ObjectId;
    user: Types.ObjectId;
}

const ReviewSchema: Schema = new mongoose.Schema<IReviewDocument>({
    product: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    userName: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    text: { 
        type: String, 
        required: true,
        trim: true
    }
}, { 
    timestamps: true 
});

ReviewSchema.index({ product: 1 });

const ReviewModel = mongoose.model<IReviewDocument>('Review', ReviewSchema);
export default ReviewModel;