import axios from 'axios';

export const api = axios.create({
    // Вкажи проксі-шлях замість прямої адреси бекенду
    baseURL: '/api', 
    withCredentials: true,
});