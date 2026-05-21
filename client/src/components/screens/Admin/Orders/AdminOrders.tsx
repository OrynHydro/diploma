'use client'

import React, { useEffect, useState } from 'react'
import { api } from '@/api/api'
import s from './AdminOrders.module.scss'
import { IOrder } from '@shared/interfaces/order.interface'
import { translateStatus } from '@/utils/translateStatus'

type OrderStatus = IOrder['status'];

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<IOrder[]>('/admin/orders')
      .then(res => setOrders(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status })
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o))
    } catch (error) {
      console.error('Failed to update status', error)
    }
  }

  return (
    <div className={s.wrapper}>
      {/* Заголовок тепер завжди на місці */}
      <h1 className={s.title}>Керування замовленнями</h1>

      {isLoading ? (
        // Лоадер під заголовком
        <div className={s.loadingContainer}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={s.skeletonRow} />
          ))}
        </div>
      ) : (
        // Таблиця з'являється після завантаження
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Клієнт</th>
              <th>Телефон</th>
              <th>Сума</th>
              <th>Замовлення</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order._id.slice(-6)}</td>
                <td>{order.deliveryInfo.firstName} {order.deliveryInfo.lastName}</td>
                <td>{order.deliveryInfo.phone}</td>
                <td>${order.totalAmount}</td>
                <td>
                  <div className={s.itemsList}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className={s.itemRow}>
                        {item.name} <span className={s.itemCount}>x{item.count}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                    className={s.statusSelect}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{translateStatus(status)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminOrdersPage