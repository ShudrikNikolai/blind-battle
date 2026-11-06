import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiEnvelope,
  ApiErrors,
  ApiPaginatedEnvelope,
  ApiProtected,
} from '@/common/swagger';
import { AuthGuard } from '../guards/auth.guard';
import {
  CreateTagDto,
  ListTagQueryDto,
  PublishTagDto,
  TagDto,
  UpdateTagDto,
} from '../dtos/tag.dto';
import { TagService } from '../tag/tag.service';

const TagIdParam = ApiParam({
  name: 'id',
  format: 'uuid',
  description: 'ID тега',
});

@ApiTags('Tag')
@ApiProtected()
@Controller('tag')
@UseGuards(AuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать тег',
    description: 'Тег создаётся неопубликованным.',
  })
  @ApiEnvelope(TagDto, { status: 201, description: 'Тег создан' })
  @ApiErrors([400, 'Валидация'], [409, 'Имя тега уже занято'])
  create(@Body() dto: CreateTagDto) {
    return this.tagService.create(dto);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Список тегов',
    description: 'Мягко удалённые теги не возвращаются.',
  })
  @ApiPaginatedEnvelope(TagDto)
  list(@Query() query: ListTagQueryDto) {
    return this.tagService.list(query);
  }

  @Get(':id')
  @TagIdParam
  @ApiOperation({ summary: 'Тег по ID' })
  @ApiEnvelope(TagDto)
  @ApiErrors([400, 'ID не является UUID'], 404)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagService.get(id);
  }

  @Patch(':id')
  @TagIdParam
  @ApiOperation({ summary: 'Переименовать тег' })
  @ApiEnvelope(TagDto)
  @ApiErrors([400, 'Пустое тело или ID не UUID'], [409, 'Имя занято'], 404)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tagService.update(id, dto);
  }

  @Patch(':id/publish')
  @TagIdParam
  @ApiOperation({
    summary: 'Опубликовать или снять тег с публикации',
    description:
      'При снятии с публикации связанные квизы тоже становятся черновиками.',
  })
  @ApiEnvelope(TagDto)
  @ApiErrors([400, 'Валидация или ID не UUID'], 404)
  publish(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishTagDto) {
    return this.tagService.setPublished(id, dto.isPublished);
  }

  @Delete(':id')
  @TagIdParam
  @ApiOperation({
    summary: 'Мягко удалить тег',
    description:
      'Связанные квизы снимаются с публикации, тег помечается deleted_at.',
  })
  @ApiEnvelope(undefined, { description: 'Тег удалён' })
  @ApiErrors([400, 'ID не UUID'], 404)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagService.remove(id);
  }
}
