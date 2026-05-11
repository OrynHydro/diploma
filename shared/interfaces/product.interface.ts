export interface IProduct {
    _id: string
    name: string;
    brand: string;           
    category: 'Laptops' | 'Monitors' | 'Audio' | 'Components' | 'Networking' | 'Gaming' | 'Smartphones';
    description: string;    
    price: number;
    image: string;          
    specs: Record<string, any>; 
    discount: number;        
    inStock: boolean;       
    vectorEmbedding: number[];
}