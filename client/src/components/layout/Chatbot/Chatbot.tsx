'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, X, Bot, User, Sparkles, ShoppingBag, Zap, Laptop, CircleDollarSign } from 'lucide-react'
import { useChat } from '@/hooks/useChat' 
import { useActions } from '@/hooks/useActions'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/api/api'

import s from './Chatbot.module.scss'
import { IMessage } from '@shared/interfaces/message.interface'

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const { messages } = useChat()
  const { addMessage } = useActions()
  const { isAuth, user } = useAuth()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (text: string, e?: React.FormEvent) => {
    e?.preventDefault()
    
    const messageText = text.trim()
    if (!messageText || isTyping) return

    setInput('')
    
    addMessage({ 
      role: 'user', 
      content: messageText, 
      timestamp: new Date().toISOString() 
    })
    setIsTyping(true)

    try {
      const guestId = !isAuth ? localStorage.getItem('guestId') : undefined
      
      const { data } = await api.post('/products/search', {
        query: messageText,
        userId: user?._id,
        guestId: guestId || undefined
      })

      addMessage({ 
        role: 'assistant', 
        content: data.answer, 
        timestamp: new Date().toISOString() 
      })
    } catch (error) {
        console.error('Chat error:', error)
        addMessage({ 
            role: 'assistant', 
            content: 'Вибачте, сталася помилка. Спробуйте пізніше.',
            timestamp: new Date().toISOString()
        })
    } finally {
      setIsTyping(false)
    }
  }

  console.log(messages)

  const suggestions = [
    { icon: <Laptop size={18} />, text: 'Потужний ноутбук', query: 'Порадь потужний ноутбук для роботи' },
    { icon: <Zap size={18} />, text: 'Топ пропозицій', query: 'Які зараз найкращі пропозиції?' },
    { icon: <ShoppingBag size={18} />, text: 'Аксесуари', query: 'Покажи ігрові аксесуари' },
    { icon: <CircleDollarSign size={18} />, text: 'Бюджетні варіанти', query: 'Знайди найкращі товари за доступною ціною' }
  ]

  return (
    <div className={s.wrapper}>
      {isOpen && (
        <div className={s.window}>
          <div className={s.header}>
            <div className={s.info}>
              <div className={s.iconBadge}>
                <Sparkles size={18} />
              </div>
              <div className={s.text}>
                <span className={s.name}>Gemini Assistant</span>
                <span className={s.status}>Онлайн</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className={s.closeBtn}>
              <X size={20} />
            </button>
          </div>

          <div className={s.messages}>
            {messages.length === 0 ? (
              <div className={s.startMenu}>
                <div className={s.welcome}>
                  <div className={s.aiIcon}>
                    <Bot size={32} />
                  </div>
                  <h3>Привіт! Чим допомогти?</h3>
                  <p>Оберіть запит або напишіть свій нижче</p>
                </div>
                
                <div className={s.grid}>
                  {suggestions.map((item, idx) => (
                    <button 
                      key={idx} 
                      className={s.suggestionCard}
                      onClick={() => handleSend(item.query)}
                    >
                      <span className={s.sugIcon}>{item.icon}</span>
                      <span className={s.sugText}>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m: IMessage, i: number) => (
                  <div 
                    key={i} 
                    className={`${s.messageRow} ${m.role === 'user' ? s.userRow : s.botRow}`}
                  >
                    <div className={s.avatar}>
                       {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={s.bubble}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {isTyping && (
              <div className={s.typing}>
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => handleSend(input, e)} className={s.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Запитайте про товари..."
              autoFocus
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button 
        className={`${s.trigger} ${isOpen ? s.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={s.glow} />
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </button>
    </div>
  )
}

export default Chatbot