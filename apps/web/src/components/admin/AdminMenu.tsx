'use client';

import { useState } from 'react';
import { Category } from '@eatfit/shared';
import {
  useAdminMenu,
  useCreateDish,
  useUpdateDish,
  useSetDishActive,
  useDeleteDish,
  type DishBody,
} from '@/lib/admin-queries';
import { useT, type I18nKey } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import { MenuItemDto } from '@/lib/types';

const CATS: { cat: Category; key: I18nKey }[] = [
  { cat: Category.Main, key: 'cat_main' },
  { cat: Category.Drink, key: 'cat_drink' },
  { cat: Category.Dessert, key: 'cat_dessert' },
];

const STR_FIELDS: { key: 'nameRu' | 'nameUz' | 'descriptionRu' | 'descriptionUz' | 'photoUrl'; label: I18nKey }[] = [
  { key: 'nameRu', label: 'adm_name_ru' },
  { key: 'nameUz', label: 'adm_name_uz' },
  { key: 'descriptionRu', label: 'adm_desc_ru' },
  { key: 'descriptionUz', label: 'adm_desc_uz' },
  { key: 'photoUrl', label: 'adm_photo_url' },
];

function emptyForm(): DishBody {
  return { category: Category.Main, nameRu: '', nameUz: '', descriptionRu: '', descriptionUz: '', price: 0, photoUrl: '' };
}

export function AdminMenu() {
  const t = useT();
  const { data: items } = useAdminMenu();
  const create = useCreateDish();
  const update = useUpdateDish();
  const setActive = useSetDishActive();
  const del = useDeleteDish();

  // undefined — список; null — новое; объект — редактирование.
  const [editing, setEditing] = useState<MenuItemDto | null | undefined>(undefined);
  const [form, setForm] = useState<DishBody>(emptyForm());

  const close = () => setEditing(undefined);
  const openNew = () => {
    setForm(emptyForm());
    setEditing(null);
  };
  const openEdit = (it: MenuItemDto) => {
    setForm({
      category: it.category,
      nameRu: it.nameRu,
      nameUz: it.nameUz,
      descriptionRu: it.descriptionRu ?? '',
      descriptionUz: it.descriptionUz ?? '',
      price: Number(it.price),
      photoUrl: '',
    });
    setEditing(it);
  };
  const submit = () => {
    const body: DishBody = {
      ...form,
      price: Number(form.price),
      photoUrl: form.photoUrl || undefined,
      descriptionRu: form.descriptionRu || undefined,
      descriptionUz: form.descriptionUz || undefined,
    };
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: close });
    else create.mutate(body, { onSuccess: close });
  };

  if (editing !== undefined) {
    return (
      <div>
        <div className="field">
          <label>{t('adm_category')}</label>
          <div className="seg">
            {CATS.map((c) => (
              <button
                key={c.cat}
                className={form.category === c.cat ? 'active' : ''}
                onClick={() => setForm({ ...form, category: c.cat })}
              >
                {t(c.key)}
              </button>
            ))}
          </div>
        </div>
        {STR_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label>{t(f.label)}</label>
            <input
              className="input"
              value={form[f.key] ?? ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="field">
          <label>{t('adm_price')}</label>
          <input
            className="input"
            inputMode="numeric"
            value={form.price || ''}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="seg">
          <button className="btn" onClick={close}>
            {t('act_cancel')}
          </button>
          <button
            className="btn btn-primary"
            disabled={!form.nameRu || !form.nameUz || form.price <= 0 || create.isPending || update.isPending}
            onClick={submit}
          >
            {t('save')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={openNew} style={{ marginBottom: 12 }}>
        {t('adm_add_dish')}
      </button>
      {items?.map((it) => (
        <div className="card" key={it.id}>
          <div className="dish-name">
            {it.nameRu}
            {!it.isActive && <span className="muted"> ({t('adm_hidden')})</span>}
          </div>
          <div className="dish-desc">
            {formatMoney(it.price)} {t('currency')}
          </div>
          <div className="seg" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => openEdit(it)}>
              {t('adm_edit')}
            </button>
            <button className="btn" onClick={() => setActive.mutate({ id: it.id, isActive: !it.isActive })}>
              {it.isActive ? t('adm_hide') : t('adm_show')}
            </button>
            <button
              className="btn"
              onClick={() => {
                if (window.confirm(t('adm_delete_q'))) del.mutate(it.id);
              }}
            >
              {t('adm_delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
