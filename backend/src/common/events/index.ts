import {
  GAME_STARTED_EVENT,
  GAME_FINISHED_EVENT,
  GAME_SOLO_FINISHED_EVENT,
  GameStartedEvent,
  GameFinishedEvent,
  GameSoloFinishedEvent,
} from './game.event';

export interface EventMap {
  [GAME_STARTED_EVENT]: GameStartedEvent;
  [GAME_FINISHED_EVENT]: GameFinishedEvent;
  [GAME_SOLO_FINISHED_EVENT]: GameSoloFinishedEvent;
}

export type EventName = keyof EventMap;
