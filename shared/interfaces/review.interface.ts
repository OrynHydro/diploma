export interface IReview {
    _id: string;
    user: string;
    userName: string; 
    rating: number;
    text: string;
    createdAt: Date;
}