'use client';

import { Truck, MapPin, CreditCard, Clock } from 'lucide-react';
import s from './Delivery.module.scss';

const DeliveryPage = () => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <h1>Доставка та оплата</h1>
        
        <section className={s.section}>
          <div className={s.card}>
            <Truck className={s.icon} size={32} />
            <h3>Доставка &quot;Нова Пошта&quot;</h3>
            <p>Відправки здійснюються щодня по всій Україні.</p>
            <p className={s.highlight}>Термін: 1-3 робочих дні.</p>
          </div>

          <div className={s.card}>
            <MapPin className={s.icon} size={32} />
            <h3>Самовивіз у Дніпрі</h3>
            <p>Безкоштовно заберіть ваше замовлення з нашого пункту видачі.</p>
            <p className={s.address}>м. Дніпро, вул. Святослава Хороброго, 12 (з 10:00 до 19:00).</p>
          </div>

          <div className={s.card}>
            <CreditCard className={s.icon} size={32} />
            <h3>Способи оплати</h3>
            <ul>
              <li>Оплата карткою на сайті через LiqPay</li>
              <li>Післяплата у відділенні &quot;Нової Пошти&quot;</li>
            </ul>
          </div>
        </section>

        <section className={s.contactsSection}>
            <div className={s.contactInfo}>
                <h2>Як нас знайти</h2>
                <p>Ми знаходимося в самому центрі Дніпра. Чекаємо на вас!</p>
                <div className={s.details}>
                <p><strong>Адреса:</strong> вул. Святослава Хороброго, 12, офіс 312</p>
                <p><strong>Телефон:</strong> +38 (067) 000-00-00</p>
                <p><strong>Email:</strong> support@techstore.com</p>
                </div>
            </div>

            <div className={s.mapWrapper}>
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2645.861333166309!2d35.04108431205269!3d48.45919007116104!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40dbe2dfac6c9eb3%3A0x4ed0587821ddadc4!2z0YPQuy4g0KHQstGP0YLQvtGB0LvQsNCy0LAg0KXRgNCw0LHRgNC-0LPQviwgMTIsINCU0L3QtdC_0YAsINCU0L3QtdC_0YDQvtC_0LXRgtGA0L7QstGB0LrQsNGPINC-0LHQu9Cw0YHRgtGMLCA0OTAwMA!5e0!3m2!1sru!2sua!4v1779277456627!5m2!1sru!2sua" 
                    width="100%" 
                    height="300" 
                    style={{ border: 0 }}
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    />
            </div>
        </section>

        <section className={s.infoBox}>
          <Clock size={20} />
          <p>
            Усі замовлення, оформлені до 16:00, передаються на відправку в той же день.
          </p>
        </section>
      </div>
    </div>
  );
};

export default DeliveryPage;