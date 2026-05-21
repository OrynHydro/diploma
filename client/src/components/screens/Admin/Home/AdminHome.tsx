'use client'

import React, { useEffect, useState } from 'react'
import { Users, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react'
import s from './AdminHome.module.scss'
import { api } from '@/api/api'

const AdminHomePage = () => {

  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, sales: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(res => {
      setStats(res.data)
      setLoading(false)
    })
  }, [])

  const statItems = [
    { title: 'Загальні продажі', value: `$ ${stats.sales.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { title: 'Нові замовлення', value: stats.orders.toString(), icon: ShoppingBag, color: '#3b82f6' },
    { title: 'Користувачі', value: stats.users.toString(), icon: Users, color: '#8b5cf6' },
    { title: 'Активні товари', value: stats.products.toString(), icon: AlertCircle, color: '#f59e0b' },
  ]

  if (loading) {
    return (
      <div className={s.loadingContainer}>
        <div className={s.pulse} />
        <div className={s.pulse} style={{ animationDelay: '0.2s' }} />
        <div className={s.pulse} style={{ animationDelay: '0.4s' }} />
        <span>Завантаження даних...</span>
      </div>
    )
  }

  return (
    <div className={s.wrapper}>
      <h1>Dashboard</h1>
      
      <div className={s.statsGrid}>
        {statItems.map((stat, i) => (
          <div key={i} className={s.statCard}>
            <div className={s.iconWrapper} style={{ backgroundColor: `${stat.color}20` }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            <div className={s.info}>
              <h3>{stat.title}</h3>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminHomePage