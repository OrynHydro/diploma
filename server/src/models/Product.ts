import mongoose, { Schema } from 'mongoose';
import type { IProduct } from '@shared/interfaces/product.interface.js';

const ProductSchema: Schema = new mongoose.Schema<IProduct>(
    {
        name: { type: String, required: true, index: true },
        brand: { type: String, required: true, index: true },
        category: { 
            type: String, 
            required: true, 
            index: true,
            enum: ['Laptops', 'Monitors', 'Audio', 'Components', 'Networking', 'Gaming', 'Smartphones']
        },
        description: { type: String, required: true }, 
        price: { type: Number, required: true },
        image: { type: String, required: true }, 
        specs: { type: Schema.Types.Mixed, required: true },
        discount: { type: Number, default: 0 },
        inStock: { type: Boolean, default: true },
        vectorEmbedding: { type: [Number], required: true },
        rating: { 
            type: Number, 
            required: true, 
            default: 0 
        },
        numReviews: { 
            type: Number, 
            required: true, 
            default: 0 
        }
    },
    { timestamps: true }
);

const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
export default ProductModel;