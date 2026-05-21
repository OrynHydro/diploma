'use client'

import React, { useEffect, useState } from 'react'
import { api } from '@/api/api'
import s from './AdminProducts.module.scss'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { IProduct } from '@shared/interfaces/product.interface'
import Image from 'next/image'
import { EditProductModal } from '@/components/ui/EditProductModal/EditProductModal'
import { CreateProductDto, CreateProductModal } from '@/components/ui/CreateProductModal/CreateProductModal'

const AdminProductsPage = () => {
  const [products, setProducts] = useState<IProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    api.get<IProduct[]>('/products')
      .then(res => setProducts(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  const deleteProduct = async (id: string) => {
    if (confirm('Видалити цей товар?')) {
      await api.delete(`/admin/products/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
    }
  }

  const updateProduct = async (updatedData: IProduct) => {
    await api.put(`/admin/products/${updatedData._id}`, updatedData)
    setProducts(prev => prev.map(p => p._id === updatedData._id ? updatedData : p))
    setEditingProduct(null)
  }

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const createProduct = async (data: CreateProductDto) => {
  try {
    const res = await api.post('/admin/products', data) 
    
    const newProduct = res.data.product || res.data; 
    
    console.log("Новий товар для стейту:", newProduct);

    if (newProduct && newProduct._id) {
        setProducts(prev => [...prev, newProduct]);
        setIsCreateModalOpen(false);
    } else {
        console.error("Сервер повернув дивний об'єкт:", newProduct);
    }
  } catch (e) {
    alert('Помилка при створенні');
  }
}

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={s.wrapper}>
      <div className={s.header}>
        <div className={s.titleGroup}>
            <h1>Товари</h1>
            <span className={s.countBadge}>
            Всього: {filteredProducts.length}
            </span>
        </div>
        <input 
          type="text"
          placeholder="Пошук за назвою або брендом..."
          className={s.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className={s.addButton} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} /> Додати товар
        </button>
      </div>

      {isLoading ? (
        <div className={s.skeletonWrapper}>
          {[...Array(5)].map((_, i) => <div key={i} className={s.skeletonRow} />)}
        </div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>Фото</th>
              <th>Назва</th>
              <th>Ціна</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id}>
                <td>
                  <Image
                    src={product.image} 
                    alt={product.name} 
                    width={75} 
                    height={75} 
                    className={s.image} 
                    priority={false}
                  />
                </td>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>
                  <div className={s.actions}>
                    <button className={s.editBtn} onClick={() => setEditingProduct(product)}>
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className={s.deleteBtn} 
                      onClick={() => deleteProduct(product._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={updateProduct} 
        />
      )}

      {isCreateModalOpen && (
        <CreateProductModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={createProduct} 
        />
      )}
    </div>
  )
}

export default AdminProductsPage