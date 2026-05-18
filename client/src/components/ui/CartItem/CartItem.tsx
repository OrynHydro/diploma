'use client'
import React, { FC, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus } from 'lucide-react'
import { ICartItem } from '@/store/cart/cartSlice'
import { useActions } from '@/hooks/useActions'
import s from './CartItem.module.scss'

const CartItem: FC<{ item: ICartItem }> = ({ item }) => {
    const { changeQuantity, removeFromCart } = useActions()
    const [isRemoving, setIsRemoving] = useState(false)

    const handleRemove = () => {
        setIsRemoving(true)
        setTimeout(() => {
            removeFromCart(item._id)
        }, 300)
    }

    const handleMinus = () => {
        if (item.count === 1) {
            handleRemove()
        } else {
            changeQuantity({ id: item._id, type: 'minus' })
        }
    }

    return (
        <div className={`${s.item} ${isRemoving ? s.removing : ''}`}>
            <div className={s.imageWrapper}>
                <Image src={item.image} alt={item.name} width={100} height={100} priority />
            </div>

            <div className={s.details}>
                <Link href={`/product/${item._id}`} className={s.name}>{item.name}</Link>
                <span className={s.brand}>{item.brand}</span>
                
                <div className={s.controls}>
                    <div className={s.quantity}>
                        <button 
                            onClick={handleMinus} 
                            className={item.count === 1 ? s.deleteBtn : ''}
                        >
                            {item.count === 1 ? <Trash2 className={s.trash} size={14} /> : <Minus size={16} />}
                        </button>
                        
                        <span>{item.count}</span>
                        
                        <button onClick={() => changeQuantity({ id: item._id, type: 'plus' })}>
                            <Plus size={16} />
                        </button>
                    </div>
                    <button className={s.removeBtn} onClick={handleRemove}>
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className={s.priceBlock}>
                {item.discount > 0 && (
                    <span className={s.oldPrice}>
                        ${Math.round((item.price / (1 - item.discount / 100)) * item.count)}
                    </span>
                )}
                
                <span className={s.price}>${item.price * item.count}</span>
                
                {item.count > 1 && (
                    <span className={s.pricePerOne}>${item.price} / шт.</span>
                )}
            </div>
        </div>
    )
}

export default CartItem