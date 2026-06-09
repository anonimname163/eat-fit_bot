'use client';

import { useState } from 'react';
import { Category, Language } from '@eatfit/shared';
import { useMenu, useCart, useAddToCart, useSetQuantity } from '@/lib/queries';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useT, type I18nKey } from '@/lib/i18n';
import { formatMoney, pick } from '@/lib/format';
import { Stepper } from '@/components/Stepper';
import { MenuItemDto } from '@/lib/types';

const CATS: { cat: Category; key: I18nKey }[] = [
  { cat: Category.Main, key: 'cat_main' },
  { cat: Category.Drink, key: 'cat_drink' },
  { cat: Category.Dessert, key: 'cat_dessert' },
];

export function MenuScreen() {
  const t = useT();
  const lang = useAuthStore((s) => s.client?.language ?? Language.Ru);
  const openDetail = useUiStore((s) => s.openDetail);
  const { data: menu, isLoading } = useMenu();
  const { data: cart } = useCart();
  const add = useAddToCart();
  const setQty = useSetQuantity();
  const busy = add.isPending || setQty.isPending;
  const [q, setQ] = useState('');

  if (isLoading) return <div className="center">{t('loading')}</div>;
  if (!menu?.length) return <div className="center">{t('menu_empty')}</div>;

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? menu.filter((i) =>
        `${i.nameRu} ${i.nameUz}`.toLowerCase().includes(needle),
      )
    : menu;

  const qtyOf = (id: string) => cart?.items.find((i) => i.menuItemId === id)?.quantity ?? 0;

  const change = (item: MenuItemDto, q: number) => {
    if (q <= 0) setQty.mutate({ menuItemId: item.id, quantity: 0 });
    else if (qtyOf(item.id) === 0) add.mutate(item.id);
    else setQty.mutate({ menuItemId: item.id, quantity: q });
  };

  return (
    <div>
      <h2>{t('nav_menu')}</h2>
      <input
        className="input"
        placeholder={t('search_ph')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      {needle && !filtered.length && <div className="center">{t('nothing_found')}</div>}
      {CATS.map(({ cat, key }) => {
        const items = filtered.filter((i) => i.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <div className="cat-title">{t(key)}</div>
            {items.map((item) => (
              <div className="card" key={item.id}>
                <div className="dish">
                  {item.hasPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="dish-photo dish-tap"
                      src={`/api/menu/${item.id}/photo`}
                      alt=""
                      onClick={() => openDetail(item.id)}
                    />
                  )}
                  <div className="dish-body">
                    <div className="dish-name dish-tap" onClick={() => openDetail(item.id)}>
                      {pick(lang, item.nameRu, item.nameUz)}
                    </div>
                    {pick(lang, item.descriptionRu, item.descriptionUz) && (
                      <div className="dish-desc">{pick(lang, item.descriptionRu, item.descriptionUz)}</div>
                    )}
                    <div className="row">
                      <span className="dish-price">
                        {formatMoney(item.price)} {t('currency')}
                      </span>
                      <Stepper
                        qty={qtyOf(item.id)}
                        busy={busy}
                        addLabel={t('add')}
                        onChange={(q) => change(item, q)}
                      />
                    </div>
                    <button className="dish-more" onClick={() => openDetail(item.id)}>
                      {t('detail_open')} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
