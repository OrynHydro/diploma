import mongoose, { Schema } from 'mongoose';
import type { IChat } from '../interfaces/chat.interface.js';

const ChatSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    guestId: { type: String, required: false },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        products: [{ 
            type: Schema.Types.ObjectId, 
            ref: 'Product' 
        }], 
        timestamp: { type: Date, default: Date.now }
    }],
    updatedAt: { type: Date, default: Date.now }
});

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);