export interface IUser {
    _id?: string
    phone?: string
    password?:string
    isGuest: boolean;
    guestId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}