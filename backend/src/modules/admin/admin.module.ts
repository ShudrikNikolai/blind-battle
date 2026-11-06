import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { QuizController } from './controllers/quiz.controller';
import { TagController } from './controllers/tag.controller';
import { AdminEntity } from './core/admin.entity';
import { AdminRepository } from './core/admin.repository';
import { AdminService } from './core/admin.service';
import { CredentialService } from './core/credential.service';
import { QuizFacade } from './facades/quiz.facade';
import { QUIZ_PORT } from './ports/quiz.port';
import { QuizEntity } from './quiz/quiz.entity';
import { QuizRepository } from './quiz/quiz.repository';
import { QuizService } from './quiz/quiz.service';
import { TagEntity } from './tag/tag.entity';
import { TagRepository } from './tag/tag.repository';
import { TagService } from './tag/tag.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity, QuizEntity, TagEntity])],
  controllers: [AdminController, QuizController, TagController],
  providers: [
    AdminRepository,
    AdminService,
    CredentialService,
    QuizRepository,
    QuizService,
    TagRepository,
    TagService,
    QuizFacade,
    { provide: QUIZ_PORT, useExisting: QuizFacade },
  ],
  exports: [QUIZ_PORT],
})
export class AdminModule {}
