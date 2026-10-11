import { Injectable } from '@nestjs/common';
import { QuizService } from '../quiz/quiz.service';
import type {
  IQuizPort,
  QuizForGame,
  QuizSnapshot,
  QuizSummary,
} from '../ports/quiz.port';

@Injectable()
export class QuizFacade implements IQuizPort {
  constructor(private readonly quizService: QuizService) {}
  findById(id: string): Promise<QuizForGame | null> {
    return this.quizService.findAnyForGame(id);
  }

  listForTest(limit: number): Promise<QuizSummary[]> {
    return this.quizService.listSummaries(limit);
  }

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
