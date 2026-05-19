'use client'
import React, { FC, useState, useEffect, useRef } from 'react'
import { useCart } from '@/hooks/useCart'
import { useActions } from '@/hooks/useActions'
import { api } from '@/api/api'
import { CreditCard, ArrowLeft, MapPin, Truck } from 'lucide-react'
import Link from 'next/link'
import s from './Checkout.module.scss'
import Script from 'next/script'
import { useAuth } from '@/hooks/useAuth' 
import axios from 'axios'

interface NavigationResponse {
    status: string;
    [key: string]: unknown;
}

interface NPRef {
    Ref: string;
    Description: string;
}

const CheckoutPage: FC = () => {
    const { items } = useCart()
    const { clearCart } = useActions()
    const { user } = useAuth() 

    const total = items.reduce((acc, item) => acc + item.price * item.count, 0)

    const [firstName, setFirstName] = useState(user?.firstName || '')
    const [lastName, setLastName] = useState(user?.lastName || '')
    const [phone, setPhone] = useState(user?.phone || '')
    
    // Нова Пошта стейти
    const [cityQuery, setCityQuery] = useState('')
    const [selectedCityRef, setSelectedCityRef] = useState('')
    const [cities, setCities] = useState<NPRef[]>([])
    const [showCityDropdown, setShowCityDropdown] = useState(false)
    
    const [warehouses, setWarehouses] = useState<NPRef[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState('')

    // Метод оплаты
    const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash'>('Card')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const cityContainerRef = useRef<HTMLDivElement>(null)

    const NP_API_KEY = process.env.NEXT_PUBLIC_NP_API_KEY

    // Синхронизация данных пользователя без каскадных рендеров
    useEffect(() => {
        if (!user) return
        const updateTimeout = setTimeout(() => {
            setFirstName(user.firstName || '')
            setLastName(user.lastName || '')
            setPhone(user.phone || '')
        }, 0) 
        return () => clearTimeout(updateTimeout)
    }, [user?.firstName, user?.lastName, user?.phone, user])

    // Поиск городов Новой Почты с дебаунсом
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (cityQuery.length < 2) {
                setCities([])
                return
            }

            try {
                const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
                    method: 'POST',
                    body: JSON.stringify({
                        apiKey: NP_API_KEY,
                        modelName: 'Address',
                        calledMethod: 'getCities',
                        methodProperties: {
                            FindByString: cityQuery,
                            Limit: '10'
                        }
                    })
                })
                const res = await response.json()
                if (res.success && res.data) {
                    setCities(res.data)
                }
            } catch (err) {
                console.error('Помилка завантаження міст:', err)
            }
        }, 400)

        return () => clearTimeout(delayDebounce)
    }, [cityQuery, NP_API_KEY])

    // Загрузка отделений после выбора города
    useEffect(() => {
        if (!selectedCityRef) {
            const clearDelay = setTimeout(() => {
                setWarehouses([])
            }, 0)
            return () => clearTimeout(clearDelay)
        }

        const fetchWarehouses = async () => {
            try {
                const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
                    method: 'POST',
                    body: JSON.stringify({
                        apiKey: NP_API_KEY,
                        modelName: 'Address',
                        calledMethod: 'getWarehouses',
                        methodProperties: {
                            CityRef: selectedCityRef,
                            Limit: '250'
                        }
                    })
                })
                const res = await response.json()
                if (res.success && res.data) {
                    setWarehouses(res.data)
                }
            } catch (err) {
                console.error('Помилка завантаження відділень:', err)
            }
        }

        fetchWarehouses()
    }, [selectedCityRef, NP_API_KEY])

    // Закрытие дропдауна при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cityContainerRef.current && !cityContainerRef.current.contains(event.target as Node)) {
                setShowCityDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (items.length === 0) {
        return (
            <div className={s.empty}>
                <h2>Ваш кошик порожній</h2>
                <Link href="/catalogue" className={s.backBtn}>Повернутися до покупок</Link>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCityRef || !selectedWarehouse) {
            alert('Будь ласка, виберіть місто та відділення зі списку!')
            return
        }
        setLoading(true)
        setError('')

        const orderData = {
            items: items.map(item => ({
                product: item._id,
                name: item.name,
                price: item.price,
                count: item.count,
                image: item.image
            })),
            totalAmount: total,
            deliveryInfo: {
                firstName,
                lastName,
                phone,
                city: cityQuery,
                postOffice: selectedWarehouse
            },
            paymentMethod
        }

        try {
            const response = await api.post('/orders', orderData)
            
            // Логика для наложенного платежа
            if (response.data?.status === 'success') {
                clearCart()
                window.location.assign('/profile')
                return
            }

            // Логика для оплаты картой (LiqPay)
            if (response.data?.status === 'liqpay_redirect') {
                const { data, signature } = response.data
                
                // @ts-expect-error window.LiqPayCheckout з'явиться після завантаження скрипта
                const checkoutWidget = window.LiqPayCheckout;

                if (checkoutWidget) {
                    checkoutWidget.init({
                        data: data,
                        signature: signature,
                        embedTo: '#liqpay_checkout',
                        mode: 'popup'
                    }).on("liqpay.callback", function() {
                        clearCart()
                        window.location.assign('/profile')
                    }).on("liqpay.ready", function() {
                        console.log("Віджет готовий до оплати")
                    }).on("liqpay.close", function() {
                        clearCart()
                        window.location.assign('/profile')
                    })
                } else {
                    setError('Помилка ініціалізації платіжного модуля LiqPay. Спробуйте пізніше.')
                    setLoading(false)
                }
            }
        } catch (err: unknown) { 
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Сталася помилка при оформленні замовлення.')
            } else if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Сталася невідома помилка при оформленні замовлення.')
            }
            setLoading(false)
        }
    }

    return (
        <div className={s.wrapper}>
            <Script 
                src="https://static.liqpay.ua/libjs/checkout.js" 
                strategy="afterInteractive" 
            />
            
            <div className={s.container}>
                <Link href="/cart" className={s.backLink}>
                    <ArrowLeft size={16} /> Назад до кошика
                </Link>

                <h1 className={s.title}>Оформлення замовлення</h1>

                {error && <div className={s.errorAlert}>{error}</div>}

                <div className={s.layout}>
                    <form onSubmit={handleSubmit} className={s.form}>
                        <div className={s.section}>
                            <h3>Контактні дані та доставка (Нова Пошта)</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className={s.inputBlock}>
                                    <label>Ім`я отримувача</label>
                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                </div>
                                <div className={s.inputBlock}>
                                    <label>Прізвище отримувача</label>
                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                </div>
                            </div>

                            <div className={s.inputBlock}>
                                <label>Номер телефону</label>
                                <input type="tel" placeholder="+380" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>

                            <div className={s.inputBlock} style={{ position: 'relative' }} ref={cityContainerRef}>
                                <label>Місто доставки</label>
                                <input 
                                    type="text" 
                                    placeholder="Введіть місто..." 
                                    value={cityQuery} 
                                    onChange={e => {
                                        setCityQuery(e.target.value)
                                        setSelectedCityRef('')
                                        setSelectedWarehouse('')
                                        setShowCityDropdown(true)
                                    }} 
                                    onFocus={() => setShowCityDropdown(true)}
                                    required 
                                />
                                {showCityDropdown && cities.length > 0 && (
                                    <ul className={s.dropdown}>
                                        {cities.map(city => (
                                            <li key={city.Ref} onClick={() => {
                                                setCityQuery(city.Description)
                                                setSelectedCityRef(city.Ref)
                                                setShowCityDropdown(false)
                                            }}>
                                                <MapPin size={14} /> {city.Description}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className={s.inputBlock}>
                                <label>Відділення Нової Пошти</label>
                                <select 
                                    value={selectedWarehouse} 
                                    onChange={e => setSelectedWarehouse(e.target.value)}
                                    disabled={!selectedCityRef || warehouses.length === 0}
                                    required
                                    className={s.select}
                                >
                                    <option value="">
                                        {!selectedCityRef 
                                            ? 'Спочатку виберіть місто...' 
                                            : 'Оберіть номер або адресу відділення'}
                                    </option>
                                    {warehouses.map(wh => (
                                        <option key={wh.Ref} value={wh.Description}>
                                            {wh.Description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Вибір методу оплати */}
                        <div className={s.section} style={{ marginTop: '24px', borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                            <h3>Спосіб оплати</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
                                    <input 
                                        type="radio" 
                                        name="method" 
                                        checked={paymentMethod === 'Card'} 
                                        onChange={() => setPaymentMethod('Card')} 
                                        style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                                    />
                                    Онлайн-оплата карткою (LiqPay)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}>
                                    <input 
                                        type="radio" 
                                        name="method" 
                                        checked={paymentMethod === 'Cash'} 
                                        onChange={() => setPaymentMethod('Cash')} 
                                        style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                                    />
                                    Оплата при отриманні (Накладений платіж)
                                </label>
                            </div>
                        </div>

                        <button type="submit" className={s.submitBtn} disabled={loading || !selectedWarehouse}>
                            {paymentMethod === 'Card' ? <CreditCard size={18} /> : <Truck size={18} />}
                            {loading 
                                ? 'Оформлення...' 
                                : paymentMethod === 'Card' 
                                    ? `Оплатити через LiqPay • $${total}` 
                                    : `Підтвердити замовлення • $${total}`}
                        </button>
                    </form>

                    <aside className={s.summary}>
                        <h3>Ваше замовлення</h3>
                        <div className={s.itemsMini}>
                            {items.map(item => (
                                <div key={item._id} className={s.itemMini}>
                                    <span>{item.name} ({item.count} шт.)</span>
                                    <strong>${item.price * item.count}</strong>
                                </div>
                            ))}
                        </div>
                        <div className={s.totalRow}>
                            <span>Разом до сплати:</span>
                            <span>${total}</span>
                        </div>
                    </aside>
                </div>

                <div id="liqpay_checkout"></div>
            </div>
        </div>
    )
}

export default CheckoutPage