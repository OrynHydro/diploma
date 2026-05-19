'use client'
import React, { FC, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useActions } from '@/hooks/useActions'
import s from './Cart.module.scss'
import CartItem from '@/components/ui/CartItem/CartItem'
import { useRouter } from 'next/navigation'

const CartPage: FC = () => {
    const { items } = useCart()
    const { clearCart } = useActions()
    const [isClearing, setIsClearing] = useState(false)

    const total = items.reduce((acc, item) => acc + item.price * item.count, 0)

    const router = useRouter()

    if (items.length === 0) {
        return (
            <div className={s.emptyCart}>
                <ShoppingBag size={80} strokeWidth={1} />
                <h2>Ваш кошик порожній</h2>
                <p>Здається, ви ще нічого не додали до кошика.</p>
                <Link href="/catalogue" className={s.continueBtn}>
                    Перейти до покупок
                </Link>
            </div>
        )
    }

    const handleClearAll = () => {
        setIsClearing(true)
        // Чекаємо поки всі анімовані елементи "вилетять"
        setTimeout(() => {
            clearCart()
            setIsClearing(false)
        }, 400)
    }

    if (items.length === 0) {
        return (
            <div className={s.emptyCart}>
                <ShoppingBag size={80} strokeWidth={1} />
                <h2>Ваш кошик порожній</h2>
                <p>Здається, ви ще нічого не додали до кошика.</p>
                <Link href="/catalogue" className={s.continueBtn}>
                    Перейти до покупок
                </Link>
            </div>
        )
    }

    return (
        <div className={s.wrapper}>
            <div className={s.container}>
                <div className={s.header}>
                    <h1>Кошик ({items.length})</h1>
                    <button 
                        className={`${s.clearBtn} ${isClearing ? s.active : ''}`} 
                        onClick={handleClearAll}
                    >
                        <Trash2 size={16} />
                        Очистити все
                    </button>
                </div>

                <div className={s.content}>
                    <div className={`${s.itemsList} ${isClearing ? s.listRemoving : ''}`}>
                        {items.map(item => (
                            <CartItem 
                                key={item._id} 
                                item={item} 
                            />
                        ))}
                    </div>

                    <aside className={s.summary}>
                        <div className={s.summaryCard}>
                            <h3>Підсумок замовлення</h3>
                            <div className={s.summaryRow}>
                                <span>Товари ({items.length})</span>
                                <span>${total}</span>
                            </div>
                            <div className={s.summaryRow}>
                                <span>Доставка</span>
                                <span className={s.free}>Безкоштовно</span>
                            </div>
                            <div className={`${s.summaryRow} ${s.total}`}>
                                <span>Загальна сума</span>
                                <span>${total}</span>
                            </div>
                            <Link href="/checkout" className={s.checkoutBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                                Оформити замовлення
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default CartPage;