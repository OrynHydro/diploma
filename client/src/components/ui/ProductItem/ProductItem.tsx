'use client'
import React, { FC, useState } from 'react'
import s from './ProductItem.module.scss'
import Link from 'next/link' // Виправив імпорт
import Image from 'next/image'
import { useActions } from '@/hooks/useActions'
import { IProduct } from '@shared/interfaces/product.interface'
import { useCart } from '@/hooks/useCart'

interface ProductItemProps {
    product: IProduct
}

const ProductItem: FC<ProductItemProps> = ({ product }) => {
    const [isAdded, setIsAdded] = useState(false)
    const { addToCart } = useActions()

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation() 
        addToCart(product)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 1000)
    }

    return (
        <div className={s.card}>
            <Link href={`/product/${product._id}`} className={s.productLink}>
                <div className={s.imageWrapper}>
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={200}
                        height={200}
                        className={s.productImg}
                        sizes="200px"
                    />
                    {product.discount > 0 && (
                        <span className={s.badge}>-{product.discount}%</span>
                    )}
                </div>

                <div className={s.mainInfo}>
                    <span className={s.brand}>{product.brand}</span>
                    <h2 className={s.name}>{product.name}</h2>
                </div>
            </Link>

            <div className={s.actions}>
                <p className={s.price}>${product.price}</p>
                <button
                    className={`${s.addBtn} ${isAdded ? s.added : ''}`}
                    onClick={handleAddToCart}
                >
                    {isAdded ? 'Додано!' : 'У кошик'}
                </button>
            </div>
        </div>
    )
}

export default ProductItem