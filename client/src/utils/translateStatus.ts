export const translateStatus = (status: string) => {
        const dictionary: Record<string, string> = {
            Pending: 'Очікує оплати',
            Paid: 'Оплачено',
            Processing: 'В обробці',
            Shipped: 'Відправлено',
            Delivered: 'Доставлено',
            Cancelled: 'Скасовано'
        }
        return dictionary[status] || status
    }