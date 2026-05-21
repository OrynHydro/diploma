import mongoose, { Schema, Document } from 'mongoose'
import type { IUser } from '@shared/interfaces/user.interface.js'

export interface IUserDocument extends IUser, Document {
    role: 'user' | 'admin';
    isAdmin(): boolean;
}

const UserSchema: Schema = new mongoose.Schema<IUserDocument>(
    {
        phone: {
            type: String,
            unique: true,
            sparse: true, 
            trim: true
        },
        password: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String
        },
        email: {
            type: String
        },
        // Додаємо роль
        role: { 
            type: String, 
            enum: ['user', 'admin'], 
            default: 'user' 
        },
        isGuest: { type: Boolean, default: false },
        guestId: { type: String, unique: true, sparse: true }
    },
    { timestamps: true }
)

UserSchema.methods.isAdmin = function(this: IUserDocument): boolean {
    return this.role === 'admin';
}

const UserModel = mongoose.model<IUserDocument>('User', UserSchema)
export default UserModel