import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Category } from '@eatfit/shared';
import { Money } from '../common/money/money';
import { MenuRepository } from './menu.repository';

interface DemoDish {
  category: Category;
  nameRu: string;
  nameUz: string;
  descriptionRu: string;
  descriptionUz: string;
  price: number;
}

const DEMO: DemoDish[] = [
  // Основные
  { category: Category.Main, nameRu: 'Плов', nameUz: 'Osh', descriptionRu: 'Классический узбекский плов с мясом и морковью', descriptionUz: 'Klassik o‘zbek oshi, go‘sht va sabzi bilan', price: 35000 },
  { category: Category.Main, nameRu: 'Лагман', nameUz: 'Lag‘mon', descriptionRu: 'Тянутая лапша с мясом и овощами', descriptionUz: 'Cho‘zma noodle, go‘sht va sabzavot bilan', price: 30000 },
  { category: Category.Main, nameRu: 'Шашлык', nameUz: 'Shashlik', descriptionRu: 'Сочный шашлык на углях', descriptionUz: 'Cho‘g‘da pishirilgan shirador shashlik', price: 40000 },
  { category: Category.Main, nameRu: 'Манты', nameUz: 'Manti', descriptionRu: 'Паровые манты с мясом', descriptionUz: 'Bug‘da pishirilgan go‘shtli manti', price: 28000 },
  // Напитки
  { category: Category.Drink, nameRu: 'Зелёный чай', nameUz: 'Ko‘k choy', descriptionRu: 'Свежезаваренный зелёный чай', descriptionUz: 'Yangi damlangan ko‘k choy', price: 5000 },
  { category: Category.Drink, nameRu: 'Айран', nameUz: 'Ayron', descriptionRu: 'Кисломолочный напиток', descriptionUz: 'Sut-qatiq ichimligi', price: 8000 },
  { category: Category.Drink, nameRu: 'Кока-Кола', nameUz: 'Coca-Cola', descriptionRu: 'Прохладительный напиток 0.5 л', descriptionUz: 'Salqin ichimlik 0.5 l', price: 10000 },
  { category: Category.Drink, nameRu: 'Компот', nameUz: 'Kompot', descriptionRu: 'Домашний компот из сухофруктов', descriptionUz: 'Uy quruq mevali komposti', price: 7000 },
  // Десерты
  { category: Category.Dessert, nameRu: 'Чак-чак', nameUz: 'Chak-chak', descriptionRu: 'Восточная сладость с мёдом', descriptionUz: 'Asalli sharq shirinligi', price: 15000 },
  { category: Category.Dessert, nameRu: 'Пахлава', nameUz: 'Paxlava', descriptionRu: 'Слоёная пахлава с орехами', descriptionUz: 'Yong‘oqli qatlama paxlava', price: 18000 },
  { category: Category.Dessert, nameRu: 'Мороженое', nameUz: 'Muzqaymoq', descriptionRu: 'Пломбир ванильный', descriptionUz: 'Vanilli plombir', price: 12000 },
  { category: Category.Dessert, nameRu: 'Халва', nameUz: 'Holva', descriptionRu: 'Подсолнечная халва', descriptionUz: 'Kungaboqar holvasi', price: 14000 },
];

/**
 * Сидер демо-меню: добавляет демо-блюда, которых ещё нет (по nameRu). Идемпотентен —
 * не дублирует при рестартах и не трогает существующие (в т.ч. созданные вручную).
 */
@Injectable()
export class MenuSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(MenuSeeder.name);

  constructor(private readonly menu: MenuRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.menu.findAll();
    const names = new Set(existing.map((d) => d.nameRu));

    let added = 0;
    for (const d of DEMO) {
      if (names.has(d.nameRu)) continue;
      await this.menu.create({
        category: d.category,
        nameRu: d.nameRu,
        nameUz: d.nameUz,
        descriptionRu: d.descriptionRu,
        descriptionUz: d.descriptionUz,
        price: Money.fromMajor(d.price),
        photoFileId: null,
        photoUrl: null,
        isActive: true,
      });
      added++;
    }
    if (added > 0) this.logger.log(`Демо-меню: добавлено ${added} блюд`);
  }
}
