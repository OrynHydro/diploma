import type mongoose from "mongoose";
import type { IMessage } from "./message.interface.js";

export interface IChat extends Document {
    userId: mongoose.Types.ObjectId;
    messages: IMessage[];
    updatedAt: Date;
}