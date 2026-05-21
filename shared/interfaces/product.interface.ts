export interface IProduct {
    _id: string
    name: string;
    brand: string;           
    category: TCategory
    description: string;    
    price: number;
    image: string;          
    specs: Record<string, any>; 
    discount: number;        
    inStock: boolean;       
    vectorEmbedding: number[];
    rating: number;      
    numReviews: number;
}

export type TCategory = 
  | 'Laptops' 
  | 'Monitors' 
  | 'Audio' 
  | 'Components' 
  | 'Networking' 
  | 'Gaming' 
  | 'Smartphones';