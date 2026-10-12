import { GameFinishedEvent } from './game.event';

export const STATISTIC_UPDATE_EVENT = 'statistic.update.user';

export interface StatisticUpdateEvent extends GameFinishedEvent {}
