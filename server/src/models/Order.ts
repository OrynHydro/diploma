import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IOrder } from '@shared/interfaces/order.interface.js';

export interface IOrderDocument extends Omit<IOrder, '_id' | 'user' | 'items'>, Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    items: {
        product: Types.ObjectId;
        name: string;
        price: number;
        count: number;
        image: string;
    }[];
}

const OrderSchema: Schema = new mongoose.Schema<IOrderDocument>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [
            {
                product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                name: { type: String, required: true },
                price: { type: Number, required: true },
                count: { type: Number, required: true },
                image: { type: String, required: true }
            }
        ],
        totalAmount: { type: Number, required: true },

        deliveryInfo: {
            firstName: { type: String, required: true, trim: true },
            lastName: { type: String, required: true, trim: true },
            phone: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            postOffice: { type: String, required: true, trim: true }
        },
        paymentMethod: {
            type: String,
            enum: ['Card', 'Cash'],
            required: true
        },

        status: {
            type: String,
            enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Pending'
        }
    },
    { timestamps: true }
);

OrderSchema.index({ user: 1 });

const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
export default OrderModel;