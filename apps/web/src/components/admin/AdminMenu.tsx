'use client';

import { useRef, useState } from 'react';
import { Category } from '@eatfit/shared';
import {
  useAdminMenu,
  useCreateDish,
  useUpdateDish,
  useSetDishActive,
  useDeleteDish,
  useUploadDishPhoto,
  useDeleteDishPhoto,
  usePublicConfig,
  usePublishDish,
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

const DAY_KEYS: I18nKey[] = ['day_1', 'day_2', 'day_3', 'day_4', 'day_5', 'day_6', 'day_7'];

function emptyForm(): DishBody {
  return { category: Category.Main, nameRu: '', nameUz: '', descriptionRu: '', descriptionUz: '', price: 0, photoUrl: '', days: [] };
}

export function AdminMenu() {
  const t = useT();
  const { data: items } = useAdminMenu();
  const create = useCreateDish();
  const update = useUpdateDish();
  const setActive = useSetDishActive();
  const del = useDeleteDish();
  const uploadPhoto = useUploadDishPhoto();
  const deletePhoto = useDeleteDishPhoto();
  const { data: config } = usePublicConfig();
  const publish = usePublishDish();

  const onPublish = (id: string) => {
    publish.mutate(id, {
      onSuccess: () => window.alert(t('adm_published')),
      onError: (e) => window.alert((e as Error).message),
    });
  };

  // Какому блюду показываем предпросмотр поста (id) — null если скрыт.
  const [postFor, setPostFor] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const deepLink = (id: string): string | null =>
    config?.botUsername ? `https://t.me/${config.botUsername}?start=item_${id}` : null;

  const copyLink = async (id: string) => {
    const link = deepLink(id);
    if (!link) {
      window.alert(t('adm_no_bot_username'));
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      window.alert(t('adm_link_copied'));
    } catch {
      window.prompt(t('adm_copy_link'), link); // фолбэк: показать для ручного копирования
    }
  };

  // undefined — список; null — новое; объект — редактирование.
  const [editing, setEditing] = useState<MenuItemDto | null | undefined>(undefined);
  const [form, setForm] = useState<DishBody>(emptyForm());
  // Версия фото — для сброса кэша <img> после загрузки/удаления.
  const [photoVer, setPhotoVer] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => setEditing(undefined);
  const openNew = () => {
    setForm(emptyForm());
    setHasPhoto(false);
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
      days: it.days ?? [],
    });
    setHasPhoto(it.hasPhoto);
    setEditing(it);
  };
  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // позволяем выбрать тот же файл повторно
    if (!file || !editing) return;
    uploadPhoto.mutate(
      { id: editing.id, file },
      {
        onSuccess: () => {
          setHasPhoto(true);
          setPhotoVer((v) => v + 1);
        },
      },
    );
  };
  const onRemovePhoto = () => {
    if (!editing) return;
    deletePhoto.mutate(editing.id, {
      onSuccess: () => {
        setHasPhoto(false);
        setPhotoVer((v) => v + 1);
      },
    });
  };
  const submit = () => {
    const body: DishBody = {
      ...form,
      price: Number(form.price),
      photoUrl: form.photoUrl || undefined,
      descriptionRu: form.descriptionRu || undefined,
      descriptionUz: form.descriptionUz || undefined,
      days: (form.days ?? []).slice().sort((a, b) => a - b),
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
        <div className="field">
          <label>{t('adm_days')}</label>
          <div className="seg">
            {DAY_KEYS.map((key, i) => {
              const day = i + 1;
              const on = (form.days ?? []).includes(day);
              return (
                <button
                  key={day}
                  className={on ? 'active' : ''}
                  onClick={() =>
                    setForm({
                      ...form,
                      days: on
                        ? (form.days ?? []).filter((d) => d !== day)
                        : [...(form.days ?? []), day],
                    })
                  }
                >
                  {t(key)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="field">
          <label>{t('adm_photo')}</label>
          {editing ? (
            <>
              {hasPhoto && (
                <img
                  className="dish-photo"
                  src={`/api/menu/${editing.id}/photo?v=${photoVer}`}
                  alt=""
                  style={{ marginBottom: 8, borderRadius: 8, maxHeight: 160, objectFit: 'cover' }}
                />
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
                style={{ display: 'none' }}
              />
              <div className="seg">
                <button
                  className="btn"
                  disabled={uploadPhoto.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadPhoto.isPending ? t('adm_photo_uploading') : t('adm_photo_upload')}
                </button>
                {hasPhoto && (
                  <button className="btn" disabled={deletePhoto.isPending} onClick={onRemovePhoto}>
                    {t('adm_photo_remove')}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="muted">{t('adm_photo_save_first')}</div>
          )}
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

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? items?.filter((it) => `${it.nameRu} ${it.nameUz}`.toLowerCase().includes(needle))
    : items;

  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={openNew} style={{ marginBottom: 12 }}>
        {t('adm_add_dish')}
      </button>
      <input
        className="input"
        placeholder={t('search_ph')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      {needle && !filtered?.length && <div className="center">{t('nothing_found')}</div>}
      {filtered?.map((it) => (
        <div className="card" key={it.id}>
          <div className="dish-name">
            {it.nameRu}
            {!it.isActive && <span className="muted"> ({t('adm_hidden')})</span>}
          </div>
          <div className="dish-desc">
            {formatMoney(it.price)} {t('currency')}
          </div>
          {it.days?.length > 0 && (
            <div className="dish-desc">
              📅{' '}
              {it.days
                .slice()
                .sort((a, b) => a - b)
                .map((d) => t(DAY_KEYS[d - 1]))
                .join(', ')}
            </div>
          )}
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
          <div className="seg" style={{ marginTop: 6 }}>
            <button className="btn" onClick={() => copyLink(it.id)}>
              {t('adm_copy_link')}
            </button>
            <button
              className="btn"
              onClick={() => setPostFor((cur) => (cur === it.id ? null : it.id))}
            >
              {t('adm_post_preview')}
            </button>
          </div>

          {postFor === it.id && (
            <div className="card" style={{ marginTop: 8, borderStyle: 'dashed' }}>
              {it.hasPhoto && (
                <img
                  className="dish-photo"
                  src={`/api/menu/${it.id}/photo`}
                  alt=""
                  style={{ borderRadius: 8, marginBottom: 8, maxHeight: 180, objectFit: 'cover' }}
                />
              )}
              <div className="dish-name">
                🍽 {it.nameRu}
                {it.nameUz && it.nameUz !== it.nameRu ? ` / ${it.nameUz}` : ''}
              </div>
              {it.descriptionRu && <div className="dish-desc">🇷🇺 {it.descriptionRu}</div>}
              {it.descriptionUz && <div className="dish-desc">🇺🇿 {it.descriptionUz}</div>}
              <div className="dish-desc">💵 {formatMoney(it.price)} сум / so‘m</div>
              {deepLink(it.id) ? (
                <a
                  className="btn btn-primary btn-block"
                  href={deepLink(it.id) as string}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginTop: 8, display: 'block', textAlign: 'center' }}
                >
                  {t('adm_order_btn')}
                </a>
              ) : (
                <div className="muted" style={{ marginTop: 8 }}>
                  {t('adm_no_bot_username')}
                </div>
              )}
              <button
                className="btn btn-block"
                disabled={publish.isPending}
                onClick={() => onPublish(it.id)}
                style={{ marginTop: 8 }}
              >
                {publish.isPending ? t('adm_publishing') : t('adm_publish')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
