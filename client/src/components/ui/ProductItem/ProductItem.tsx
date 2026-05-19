'use client'
import React, { FC, useState } from 'react'
import s from './ProductItem.module.scss'
import Link from 'next/link' 
import Image from 'next/image'
import { useActions } from '@/hooks/useActions'
import { IProduct } from '@shared/interfaces/product.interface'
import { Star } from 'lucide-react' 

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
                    <div className={s.metaRow}>
                        <span className={s.brand}>{product.brand}</span>
                        
                        {product.numReviews > 0 ? (
                            <div className={s.rating}>
                                <Star size={13} fill="#ffbc0b" color="#ffbc0b" />
                                <span className={s.ratingValue}>{product.rating.toFixed(1)}</span>
                                <span className={s.reviewCount}>({product.numReviews})</span>
                            </div>
                        ) : (
                            <div className={s.noRating}>Немає оцінок</div>
                        )}
                    </div>
                    
                    <h2 className={s.name}>{product.name}</h2>
                </div>
            </Link>

            <div className={s.actions}>
                <div className={s.priceWrapper}>
                    <p className={s.price}>${product.price}</p>
                    {product.discount > 0 && (
                        <span className={s.oldPrice}>
                            ${Math.round(product.price / (1 - product.discount / 100))}
                        </span>
                    )}
                </div>
                
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