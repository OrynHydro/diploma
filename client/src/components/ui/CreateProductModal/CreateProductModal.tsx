'use client'
import React, { useState } from 'react'
import s from './CreateProductModal.module.scss'
import { IProduct, TCategory } from '@shared/interfaces/product.interface'
import { categoryMap } from '@/helpers/categories';
import { api } from '@/api/api'; // Переконайся, що імпортуєш свій інстанс axios

export type CreateProductDto = Omit<IProduct, '_id' | 'createdAt' | 'updatedAt' | 'vectorEmbedding' | 'rating' | 'numReviews'>;

interface ICreateProductModalProps {
  onClose: () => void
  onCreate: (product: CreateProductDto) => void 
}

export const CreateProductModal = ({ onClose, onCreate }: ICreateProductModalProps) => {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    brand: '',
    category: 'Laptops' as TCategory,
    description: '',
    price: 0,
    image: '',
    specs: {},
    discount: 0,
    inStock: true
  })
  
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let imageUrl = formData.image;

    if (file) {
      try {
        const fileData = new FormData();
        fileData.append('image', file);
        
        const res = await api.post('/admin/upload', fileData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = res.data.url; 
      } catch (error) {
        console.error("Помилка завантаження файлу:", error);
        alert("Не вдалося завантажити картинку");
        return;
      }
    }

    onCreate({ ...formData, image: imageUrl })
  }

  const CATEGORIES = ['Laptops', 'Monitors', 'Audio', 'Components', 'Networking', 'Gaming', 'Smartphones'];

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <h2>Створити товар</h2>
        <form onSubmit={handleSubmit} className={s.form}>
          <input placeholder="Назва" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="Бренд" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
          
          <select 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value as TCategory})}
            className={s.select}
          >
            {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{categoryMap[cat] || cat}</option>
            ))}
          </select>

          <div className={s.fileInput}>
            <label>Зображення:</label>
            <input type="file" accept="image/*" onChange={e => e.target.files && setFile(e.target.files[0])} />
          </div>

          <input type="number" placeholder="Ціна" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
          <input 
            type="number" 
            placeholder="Знижка (%). Якщо знижки немає - залишити поле пустим" 
            value={formData.discount === 0 ? '' : formData.discount} 
            onChange={e => {
              const val = e.target.value;
              setFormData({
                ...formData, 
                discount: val === '' ? 0 : Number(val)
              });
            }} 
          />
          
          <textarea placeholder="Опис" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          
          <textarea 
            placeholder='Характеристики (JSON)' 
            onChange={e => { try { setFormData({...formData, specs: JSON.parse(e.target.value)}) } catch {} }} 
          />
          
          <div className={s.actions}>
            <button type="button" onClick={onClose} className={s.cancelBtn}>Скасувати</button>
            <button type="submit" className={s.submitBtn}>Створити</button>
          </div>
        </form>
      </div>
    </div>
  )
}