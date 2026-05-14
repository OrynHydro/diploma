import mongoose, { Schema } from 'mongoose'
import type { IUser } from '@shared/interfaces/user.interface.js'

export interface IUserDocument extends IUser, Document {
    
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
    name: {
        type: String,
    },
    email: {
        type: String
    },
        isGuest: { type: Boolean, default: false },
        guestId: { type: String, unique: true, sparse: true }
	},
	{ timestamps: true }
)

const UserModel = mongoose.model<IUserDocument>('User', UserSchema)
export default UserModel
