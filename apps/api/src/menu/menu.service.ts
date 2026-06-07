import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category } from '@eatfit/shared';
import { NotFoundError } from '../common/errors/domain-error';
import { Money } from '../common/money/money';
import { currentIsoWeekday } from '../common/time/weekday';
import { MenuRepository } from './menu.repository';
import { MenuItem } from './entities/menu-item.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';

@Injectable()
export class MenuService {
  constructor(
    private readonly repo: MenuRepository,
    private readonly config: ConfigService,
  ) {}

  async showcase(category?: Category): Promise<MenuItemResponseDto[]> {
    // Витрина — только блюда на сегодняшний день недели (по локальному TZ).
    const items = await this.repo.findActive(category, this.currentIsoWeekday());
    return items.map((i) => new MenuItemResponseDto(i));
  }

  /** Текущий день недели ISO (1=Пн…7=Вс) с учётом часового пояса приложения. */
  private currentIsoWeekday(): number {
    return currentIsoWeekday(this.config.get<number>('reports.tzOffsetHours') ?? 5);
  }

  async listAll(): Promise<MenuItemResponseDto[]> {
    const items = await this.repo.findAll();
    return items.map((i) => new MenuItemResponseDto(i));
  }

  async getEntityOrThrow(id: string): Promise<MenuItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError('Блюдо не найдено');
    return item;
  }

  async getOne(id: string): Promise<MenuItemResponseDto> {
    return new MenuItemResponseDto(await this.getEntityOrThrow(id));
  }

  async create(dto: CreateMenuItemDto): Promise<MenuItemResponseDto> {
    const item = await this.repo.create({
      category: dto.category,
      nameRu: dto.nameRu,
      nameUz: dto.nameUz,
      descriptionRu: dto.descriptionRu ?? null,
      descriptionUz: dto.descriptionUz ?? null,
      price: Money.fromMajor(dto.price),
      photoFileId: dto.photoFileId ?? null,
      photoUrl: dto.photoUrl ?? null,
      isActive: dto.isActive ?? true,
      days: dto.days ?? [],
    });
    return new MenuItemResponseDto(item);
  }

  async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItemResponseDto> {
    const item = await this.getEntityOrThrow(id);
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.nameRu !== undefined) item.nameRu = dto.nameRu;
    if (dto.nameUz !== undefined) item.nameUz = dto.nameUz;
    if (dto.descriptionRu !== undefined) item.descriptionRu = dto.descriptionRu;
    if (dto.descriptionUz !== undefined) item.descriptionUz = dto.descriptionUz;
    if (dto.price !== undefined) item.price = Money.fromMajor(dto.price);
    if (dto.photoFileId !== undefined) item.photoFileId = dto.photoFileId;
    if (dto.photoUrl !== undefined) item.photoUrl = dto.photoUrl;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;
    if (dto.days !== undefined) item.days = dto.days;
    return new MenuItemResponseDto(await this.repo.save(item));
  }

  async setActive(id: string, isActive: boolean): Promise<MenuItemResponseDto> {
    const item = await this.getEntityOrThrow(id);
    item.isActive = isActive;
    return new MenuItemResponseDto(await this.repo.save(item));
  }

  async remove(id: string): Promise<void> {
    await this.getEntityOrThrow(id);
    await this.repo.delete(id);
  }

  /** Бинарь загруженного фото (для прокси-эндпоинта). */
  loadPhotoBytes(id: string): Promise<{ data: Buffer; mime: string } | null> {
    return this.repo.findPhotoBytes(id);
  }

  /** Сохранить загруженное фото (Mini App/сайт). Сбрасывает file_id/URL — источник один. */
  async setPhoto(id: string, data: Buffer, mime: string): Promise<MenuItemResponseDto> {
    const item = await this.getEntityOrThrow(id);
    item.photoData = data;
    item.photoMime = mime;
    item.photoFileId = null;
    item.photoUrl = null;
    return new MenuItemResponseDto(await this.repo.save(item));
  }

  /** Удалить любое фото блюда. */
  async clearPhoto(id: string): Promise<MenuItemResponseDto> {
    const item = await this.getEntityOrThrow(id);
    item.photoData = null;
    item.photoMime = null;
    item.photoFileId = null;
    item.photoUrl = null;
    return new MenuItemResponseDto(await this.repo.save(item));
  }
}
