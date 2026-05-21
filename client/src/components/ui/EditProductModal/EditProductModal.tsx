'use client'
import React, { useState } from 'react'
import s from './EditProductModal.module.scss'
import { IProduct } from '@shared/interfaces/product.interface.js'

interface IEditProductModalProps {
  product: IProduct
  onClose: () => void
  onSave: (product: IProduct) => void
}

export const EditProductModal = ({ product, onClose, onSave }: IEditProductModalProps) => {
  const [formData, setFormData] = useState<IProduct>(product)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <h2>Редагувати: {product.name}</h2>
        <form onSubmit={handleSubmit}>
          
          <label>Ціна (₴)</label>
          <input 
            type="number" 
            value={formData.price} 
            onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
          />

          <label>Знижка (%)</label>
          <input 
            type="number" 
            value={formData.discount} 
            onChange={e => setFormData({...formData, discount: Number(e.target.value)})} 
          />

          <label className={s.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={formData.inStock} 
              onChange={e => setFormData({...formData, inStock: e.target.checked})} 
            />
            <span>В наявності</span>
          </label>

          <div className={s.actions}>
            <button type="button" onClick={onClose}>Скасувати</button>
            <button type="submit">Зберегти зміни</button>
          </div>
        </form>
      </div>
    </div>
  )
}