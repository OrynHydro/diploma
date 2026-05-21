'use client'
import React, { FC, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useActions } from '@/hooks/useActions'
import { User, Package, LogOut, ChevronRight, Mail, Edit3, MessageSquare, Star, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import s from './Profile.module.scss'
import ProfileEditForm from '@/components/ui/ProfileEdit/ProfileEdit'
import { api } from '@/api/api'
import Link from 'next/link'
import { IOrder } from '@shared/interfaces/order.interface'
import { IReview } from '@shared/interfaces/review.interface'
import { translateStatus } from '@/utils/translateStatus'
interface IProfileReview extends IReview {
    product: {
        _id: string;
        name: string;
        image: string;
        price: number;
    } | null;
}

interface IProfileOrder extends Omit<IOrder, 'deliveryInfo'> {
    deliveryInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        city: string;
        postOffice: string;
    };
}

const Profile: FC = () => {
    const { user, isLoading } = useAuth()
    const { logout } = useActions()
    
    const [activeTab, setActiveTab] = useState<'orders' | 'edit' | 'reviews'>('orders')
    
    const [myReviews, setMyReviews] = useState<IProfileReview[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)

    const [myOrders, setMyOrders] = useState<IProfileOrder[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)

    const handleLogout = async () => {
        try {
            await api.post('/users/logout')
            logout() 
            window.location.assign('/')
        } catch (error) {
            console.error('Помилка під час виходу з акаунту:', error)
        }
    }

    useEffect(() => {
        if (activeTab === 'orders' && user && !user.isGuest) {
            const fetchMyOrders = async () => {
                try {
                    setOrdersLoading(true)
                    const res = await api.get('/orders/my-orders') 
                    setMyOrders(res.data)
                } catch (err) {
                    console.error('Помилка завантаження замовлень:', err)
                } finally {
                    setOrdersLoading(false)
                }
            }
            fetchMyOrders()
        }
    }, [activeTab, user])

    useEffect(() => {
        if (activeTab === 'reviews' && user && !user.isGuest) {
            const fetchMyReviews = async () => {
                try {
                    setReviewsLoading(true)
                    const res = await api.get('/reviews/my-reviews')
                    setMyReviews(res.data)
                } catch (err) {
                    console.error('Помилка завантаження особистих відгуків:', err)
                } finally {
                    setReviewsLoading(false)
                }
            }
            fetchMyReviews()
        }
    }, [activeTab, user])

    if (isLoading) return <div className={s.centerLoader}>Завантаження профілю...</div>

    if (!user || user.isGuest) {
        return (
            <div className={s.guestWrapper}>
                <div className={s.guestContent}>
                    <User size={60} className={s.guestIcon} />
                    <h1>Ви не авторизовані</h1>
                    <p>Увійдіть, щоб керувати профілем та бачити свої замовлення.</p>
                    <button className={s.loginBtn}>Увійти в систему</button>
                </div>
            </div>
        )
    }

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Processing': return s.statusProcessing;
            case 'Shipped': return s.statusShipped;
            case 'Delivered': return s.statusDelivered;
            case 'Cancelled': return s.statusCancelled;
            default: return s.statusPending;
        }
    }
    return (
        <div className={s.wrapper}>
            <div className={s.container}>
                <aside className={s.sidebar}>
                    <div className={s.userCard}>
                        <div className={s.avatarWrapper}>
                            <User size={40} />
                        </div>
                        <div className={s.userMeta}>
                            <h2>
                                {user?.firstName && user?.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : 'Користувач'}
                            </h2>
                            {user.email && (
                                <span><Mail size={14} /> {user.email}</span>
                            )}
                        </div>
                        <button className={s.logoutBtn} onClick={handleLogout}>
                            <LogOut size={18} /> Вийти
                        </button>
                    </div>

                    <nav className={s.menu}>
                        <button 
                            className={`${s.menuItem} ${activeTab === 'orders' ? s.active : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <Package size={20} /> Мої замовлення <ChevronRight size={16} />
                        </button>
                        <button 
                            className={`${s.menuItem} ${activeTab === 'reviews' ? s.active : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            <MessageSquare size={20} /> Мої відгуки <ChevronRight size={16} />
                        </button>
                        <button 
                            className={`${s.menuItem} ${activeTab === 'edit' ? s.active : ''}`}
                            onClick={() => setActiveTab('edit')}
                        >
                            <Edit3 size={20} /> Редагувати профіль <ChevronRight size={16} />
                        </button>
                    </nav>
                </aside>

                <main className={s.main}>
                    {/* ТАБ: ЗАМОВЛЕННЯ */}
                    {activeTab === 'orders' && (
                        <section className={s.section}>
                            <h3>Останні замовлення</h3>
                            
                            {ordersLoading ? (
                                <div className={s.reviewsSkeleton}>
                                    {[1, 2].map((i) => (
                                        <div key={i} className={s.skeletonCard}>
                                            <div className={s.skeletonProductBadge} style={{ marginBottom: 0 }}>
                                                <div className={s.skeletonProductImg}></div>
                                                <div className={s.skeletonProductMeta}>
                                                    <div className={s.skeletonProductTitle}></div>
                                                    <div className={s.skeletonProductPrice}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : myOrders.length > 0 ? (
                                <div className={s.ordersList}>
                                    {myOrders.map((order) => (
                                        <div key={order._id} className={s.orderCard}>
                                            <div className={s.orderHeader}>
                                                <div className={s.orderMetaInfo}>
                                                    <span className={s.orderId}>Замовлення #{order._id.slice(-6).toUpperCase()}</span>
                                                    <span className={s.orderDate}>
                                                        {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                                                    </span>
                                                </div>
                                                <span className={`${s.statusBadge} ${getStatusClass(order.status)}`}>
                                                    {translateStatus(order.status)}
                                                </span>
                                            </div>

                                            <div className={s.orderItemsList}>
                                                {order.items.map((item, index) => (
                                                    <div key={index} className={s.productMiniCard}>
                                                        <div className={s.imgBox}>
                                                            {item.image && (
                                                                <Image 
                                                                    src={item.image} 
                                                                    alt={item.name} 
                                                                    width={50} 
                                                                    height={50} 
                                                                    unoptimized
                                                                />
                                                            )}
                                                        </div>
                                                        <div className={s.pInfo}>
                                                            <span className={s.pName}>{item.name}</span>
                                                            <span className={s.pPrice}>
                                                                {item.count} шт. × ${item.price}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={s.orderFooter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                                <div className={s.orderDeliveryCity} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span><strong>Доставка:</strong> м. {order.deliveryInfo?.city || 'Не вказано'}</span>
                                                    {order.deliveryInfo?.postOffice && (
                                                        <span style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                                                            {order.deliveryInfo.postOffice}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={s.orderPriceTotal} style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                                                    <span>Разом:</span>
                                                    <strong>${order.totalAmount}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={s.emptyOrders}>
                                    <Package size={40} />
                                    <p>У вас поки немає замовлень</p>
                                    <Link href="/catalogue">
                                        <button className={s.shopBtn}>До каталогу</button>
                                    </Link>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ТАБ: РЕДАГУВАННЯ ПРОФИЛЮ */}
                    {activeTab === 'edit' && (
                        <section className={s.section}>
                            <h3>Налаштування профілю</h3>
                            <ProfileEditForm user={user} />
                        </section>
                    )}

                    {/* ТАБ: ВІДГУКИ */}
                    {activeTab === 'reviews' && (
                        <section className={s.section}>
                            <h3>Історія моїх відгуків</h3>
                            
                            {reviewsLoading ? (
                                <div className={s.reviewsSkeleton}>
                                    {[1, 2].map((i) => (
                                        <div key={i} className={s.skeletonCard}>
                                            <div className={s.skeletonProductBadge}>
                                                <div className={s.skeletonProductImg}></div>
                                                <div className={s.skeletonProductMeta}>
                                                    <div className={s.skeletonProductTitle}></div>
                                                    <div className={s.skeletonProductPrice}></div>
                                                </div>
                                            </div>
                                            <div className={s.skeletonRow}>
                                                <div className={s.skeletonStars}></div>
                                                <div className={s.skeletonDate}></div>
                                            </div>
                                            <div className={s.skeletonText}></div>
                                        </div>
                                    ))}
                                </div>
                            ) : myReviews.length > 0 ? (
                                <div className={s.profileReviewsList}>
                                    {myReviews.map((rev) => (
                                        <div key={rev._id} className={s.profileReviewItem}>
                                            {rev.product ? (
                                                <div className={s.productMiniCard}>
                                                    <div className={s.imgBox}>
                                                        <Image src={rev.product.image} alt={rev.product.name} width={50} height={50} unoptimized />
                                                    </div>
                                                    <div className={s.pInfo}>
                                                        <Link href={`/product/${rev.product._id}`} className={s.pName}>
                                                            {rev.product.name} <ArrowUpRight size={14} />
                                                        </Link>
                                                        <span className={s.pPrice}>${rev.product.price}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className={s.deletedProduct}>Товар більше недоступний в магазині</p>
                                            )}
                                            
                                            <div className={s.reviewContentBlock}>
                                                <div className={s.reviewMetaRow}>
                                                    <div className={s.userStars}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                size={14} 
                                                                fill={i < rev.rating ? "#ffbc0b" : "transparent"} 
                                                                color={i < rev.rating ? "#ffbc0b" : "#e4e4e7"} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className={s.date}>
                                                        {new Date(rev.createdAt).toLocaleDateString('uk-UA')}
                                                    </span>
                                                </div>
                                                <p className={s.reviewText}>{rev.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={s.emptyOrders}>
                                    <MessageSquare size={40} />
                                    <p>Ви ще не залишили жодного відгуку</p>
                                    <button className={s.shopBtn} onClick={() => setActiveTab('orders')}>До замовлень</button>
                                </div>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Profile