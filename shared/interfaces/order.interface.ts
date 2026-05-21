export interface IOrderItem {
    product: string;
    name: string;
    price: number;
    count: number;
    image: string;
}

export interface IOrder {
    _id: string;
    user: string;
    items: IOrderItem[];
    totalAmount: number;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: Date;
    deliveryInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        city: string;
        postOffice: string;
    };
    paymentMethod: 'Card' | 'Cash';
}