export interface IProduct {
    name: string;
    specs: Record<string, any>; 
    price: number;
    vectorEmbedding: number[];
}