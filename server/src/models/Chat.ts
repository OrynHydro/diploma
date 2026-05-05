import mongoose, { Schema } from 'mongoose';
import type { IChat } from '../interfaces/chat.interface.js';

const ChatSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    updatedAt: { type: Date, default: Date.now }
});

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);