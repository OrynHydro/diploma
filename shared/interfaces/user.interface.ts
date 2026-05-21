export interface IUser {
    phone?: string
    password?:string
    isGuest: boolean;
    guestId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role: string
}