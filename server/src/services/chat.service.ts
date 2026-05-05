import { Chat } from './../models/Chat.js';

export async function addMessageToChat(userId: string, role: 'user' | 'assistant', content: string) {
    return await Chat.findOneAndUpdate(
        { userId },
        { 
            $push: { messages: { role, content, timestamp: new Date() } },
            $set: { updatedAt: new Date() }
        },
        { upsert: true, returnDocument: 'after' } 
    );
}