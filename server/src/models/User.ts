import mongoose, { Schema } from 'mongoose'
import type { IUser } from '@shared/interfaces/user.interface.js'

export interface IUserDocument extends IUser, Document {
    
}

const UserSchema: Schema = new mongoose.Schema<IUserDocument>(
	{
		phone: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }
	},
	{ timestamps: true }
)

const UserModel = mongoose.model<IUserDocument>('User', UserSchema)
export default UserModel
