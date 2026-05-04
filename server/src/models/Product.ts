import mongoose, { Schema } from 'mongoose';
import type { IProduct } from '../interfaces/product.interface.js';

const ProductSchema: Schema = new mongoose.Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
            index: true 
        },
        specs: {
            type: Schema.Types.Mixed, 
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        vectorEmbedding: {
            type: [Number], 
            required: true
        }
    },
    { timestamps: true }
);

const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
export default ProductModel;