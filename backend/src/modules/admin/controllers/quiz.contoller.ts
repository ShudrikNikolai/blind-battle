import {
  Body,
  Controller,
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
import { QuizService } from '../quiz/quiz.service';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentAdminId } from '../decorators/current-admin-id.decorator';
import {
  CreateQuizDto,
  ListQuizQueryDto,
  PublishQuizDto,
  QuizDto,
  UpdateQuizDto,
} from '../dtos/quiz.dto';

const QuizIdParam = ApiParam({
  name: 'id',
  format: 'uuid',
  description: 'ID квиза',
});

@ApiTags('Quiz')
@ApiProtected()
@Controller('quiz')
@UseGuards(AuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать квиз',
    description:
      'Новый квиз создаётся неопубликованным. В каждом вопросе ровно один верный ответ.',
  })
  @ApiEnvelope(QuizDto, { status: 201, description: 'Квиз создан' })
  @ApiErrors([400, 'Валидация или в вопросе не ровно один верный ответ'])
  create(@CurrentAdminId() adminId: string, @Body() dto: CreateQuizDto) {
    return this.quizService.create(adminId, dto);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Список квизов',
    description: 'Постраничный вывод, новые сверху.',
  })
  @ApiPaginatedEnvelope(QuizDto)
  @ApiErrors([400, 'Некорректные параметры page/limit'])
  list(@Query() q: ListQuizQueryDto) {
    return this.quizService.list(q.page, q.limit);
  }

  @Get(':id')
  @QuizIdParam
  @ApiOperation({ summary: 'Квиз по ID' })
  @ApiEnvelope(QuizDto)
  @ApiErrors([400, 'ID не является UUID'], 404)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.get(id);
  }

  @Patch(':id')
  @QuizIdParam
  @ApiOperation({
    summary: 'Изменить квиз',
    description:
      'Можно передать title и/или content. Уже начатые игры не затрагиваются: у каждой свой снапшот вопросов.',
  })
  @ApiEnvelope(QuizDto)
  @ApiErrors([400, 'Пустое тело, валидация или ID не UUID'], 404)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.update(id, dto);
  }

  @Patch(':id/publish')
  @QuizIdParam
  @ApiOperation({
    summary: 'Опубликовать или скрыть квиз',
    description: 'Только опубликованные квизы выбираются для новых игр.',
  })
  @ApiEnvelope(QuizDto)
  @ApiErrors([400, 'Валидация или ID не UUID'], 404)
  publish(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishQuizDto) {
    return this.quizService.setPublished(id, dto.isPublished);
  }
}
