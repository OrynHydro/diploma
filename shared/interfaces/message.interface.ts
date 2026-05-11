import { IProduct } from "./product.interface";

export interface IMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    products?: IProduct[];
}