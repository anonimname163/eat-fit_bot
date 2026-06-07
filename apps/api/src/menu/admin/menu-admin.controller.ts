import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@eatfit/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { MenuService } from '../menu.service';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item.dto';
import { SetActiveDto } from '../dto/set-active.dto';

// Лимит размера загружаемого фото (байты).
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Админ-управление меню (отдельный контроллер, не флажок внутри клиентского). */
@Controller('admin/menu')
@Roles(Role.Admin)
export class MenuAdminController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  listAll() {
    return this.menu.listAll();
  }

  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this.menu.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menu.update(id, dto);
  }

  @Patch(':id/active')
  setActive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetActiveDto) {
    return this.menu.setActive(id, dto.isActive);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menu.remove(id);
  }

  /** Загрузка фото блюда файлом (Mini App/сайт). Хранится в БД, отдаётся через /menu/:id/photo. */
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл не передан');
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Допустимы только изображения');
    }
    return this.menu.setPhoto(id, file.buffer, file.mimetype);
  }

  /** Удалить фото блюда. */
  @Delete(':id/photo')
  removePhoto(@Param('id', ParseUUIDPipe) id: string) {
    return this.menu.clearPhoto(id);
  }
}
