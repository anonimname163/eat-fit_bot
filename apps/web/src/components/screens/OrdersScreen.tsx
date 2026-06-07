'use client';

import { OrderStatus } from '@eatfit/shared';
import { useOrders } from '@/lib/queries';
import { useT, type I18nKey } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';

const STATUS_KEY: Record<OrderStatus, I18nKey> = {
  [OrderStatus.Pending]: 'status_pending',
  [OrderStatus.Confirmed]: 'status_confirmed',
  [OrderStatus.Cooking]: 'status_cooking',
  [OrderStatus.Delivering]: 'status_delivering',
  [OrderStatus.Done]: 'status_done',
  [OrderStatus.Cancelled]: 'status_cancelled',
};

export function OrdersScreen() {
  const t = useT();
  const { data: orders, isLoading } = useOrders();

  if (isLoading) return <div className="center">{t('loading')}</div>;
  if (!orders?.length) return <div className="center">{t('no_orders')}</div>;

  return (
    <div>
      <h2>{t('nav_orders')}</h2>
      {orders.map((o) => (
        <div className="card" key={o.id}>
          <div className="row">
            <strong>
              {t('order')} #{o.id.slice(0, 8)}
            </strong>
            <span className="muted">{t(STATUS_KEY[o.status])}</span>
          </div>
          <div className="dish-desc" style={{ marginTop: 6 }}>
            {o.items.map((it) => `${it.nameRu} ×${it.quantity}`).join(', ')}
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
            <strong>
              {formatMoney(o.total)} {t('currency')}
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}
