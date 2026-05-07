import { PayloadAction } from './../../../node_modules/@reduxjs/toolkit/src/createAction'
import { createSlice } from '@reduxjs/toolkit'
import { IMessage } from '@shared/interfaces/message.interface';
import {IUser} from '@shared/interfaces/user.interface'

interface ChatState {
  messages: IMessage[];
  user: IUser | null;
}

const initialState: ChatState = {
  messages: [],
  user: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<IMessage[]>) => {
      state.messages = action.payload
    },
    addMessage: (state, action: PayloadAction<IMessage>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  },
});

export const { setMessages, addMessage, clearMessages } = chatSlice.actions

export default chatSlice.reducer