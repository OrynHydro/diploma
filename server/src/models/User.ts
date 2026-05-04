import mongoose, { Schema } from 'mongoose'
import type { IUser } from '../interfaces/user.interface.js'

const UserSchema: Schema = new mongoose.Schema<IUser>(
	{
		name: {
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

const UserModel = mongoose.model<IUser>('User', UserSchema)
export default UserModel
