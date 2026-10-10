import {
  GAME_STARTED_EVENT,
  GAME_FINISHED_EVENT,
  GameStartedEvent,
  GameFinishedEvent,
} from './game.event';

export interface EventMap {
  [GAME_STARTED_EVENT]: GameStartedEvent;
  [GAME_FINISHED_EVENT]: GameFinishedEvent;
}

export type EventName = keyof EventMap;
