import { Injectable } from '@nestjs/common';
import { QuizService } from '../quiz/quiz.service';
import type { IQuizPort, QuizForGame, QuizSnapshot } from '../ports/quiz.port';

@Injectable()
export class QuizFacade implements IQuizPort {
  constructor(private readonly quizService: QuizService) {}
  listQuizzes(cursor: string, limit: number): Promise<QuizSnapshot[] | null> {
    throw new Error('Method not implemented.');
  }

  findPublishedById(id: string): Promise<QuizForGame | null> {
    return this.quizService.findPublishedForGame(id);
  }

  getRandomPublished(): Promise<QuizForGame | null> {
    return this.quizService.getRandomPublishedForGame();
  }
}
