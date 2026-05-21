import { IProduct } from '@shared/interfaces/product.interface';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ICartItem extends IProduct {
  count: number;
}

export interface CartState {
  items: ICartItem[];
}

const initialState: CartState = {
  items: [],
};

const saveToLocalStorage = (items: ICartItem[]) => {
  localStorage.setItem('cart', JSON.stringify(items));
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<ICartItem[]>) => {
      state.items = action.payload;
    },

    addToCart: (state, action: PayloadAction<IProduct>) => {
      const isExist = state.items.find(item => item._id === action.payload._id);
      if (isExist) {
        isExist.count++;
      } else {
        state.items.push({ ...action.payload, count: 1 });
      }
      saveToLocalStorage(state.items); 
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
      saveToLocalStorage(state.items); 
    },

    changeQuantity: (state, action: PayloadAction<{ id: string; type: 'plus' | 'minus' }>) => {
      const itemIndex = state.items.findIndex(item => item._id === action.payload.id);
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        if (action.payload.type === 'plus') {
          item.count++;
        } else {
          if (item.count > 1) {
            item.count--;
          } else {
            state.items.splice(itemIndex, 1);
          }
        }
      }
      saveToLocalStorage(state.items); 
    },

    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cart'); 
    },
  },
});

export const { addToCart, removeFromCart, changeQuantity, clearCart, setCart } = cartSlice.actions;


export default cartSlice.reducer;