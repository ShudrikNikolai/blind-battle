import { Injectable } from '@nestjs/common';
import { QuizService } from '../quiz/quiz.service';
import type {
  IQuizPort,
  QuizForGame,
  QuizSummary,
  QuizTagSummary,
} from '@/common/contracts/quiz';

@Injectable()
export class QuizFacade implements IQuizPort {
  constructor(private readonly quizService: QuizService) {}
  findById(id: string): Promise<QuizForGame | null> {
    return this.quizService.findAnyForGame(id);
  }

  listForTest(limit: number): Promise<QuizSummary[]> {
    return this.quizService.listSummaries(limit);
  }

  findPublishedById(id: string): Promise<QuizForGame | null> {
    return this.quizService.findPublishedForGame(id);
  }

  getRandomPublished(tagId?: string): Promise<QuizForGame | null> {
    return this.quizService.getRandomPublishedForGame(tagId);
  }

  listPublishedTopics(): Promise<QuizTagSummary[]> {
    return this.quizService.listPublishedTopics();
  }
}
