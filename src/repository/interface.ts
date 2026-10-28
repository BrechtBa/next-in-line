import type { EventCollection, EventData } from "../Domain";


export type RepositoryEventData = {
  key: string;
  title: string;
  plannedStartDate: Date;
  plannedFinishDate: Date | null;
  startDate: Date | null;
  finishDate: Date | null;
  started: boolean;
  finished: boolean;
}


export type RepositoryEventCollectionData = {
  key: string;
  title: string;
  events: Array<RepositoryEventData>;
  order: number;
}


export type RepositoryUserEventData = {
  dashboard: string;
  eventCollection: string;
  event: string;
  isFavorite: boolean;
}


export interface EventRepository {
  addDashboard(dashboard: string, editToken: string, callback: (dashboard: string, editToken: string) => void, errorCallback: (error: string) => void): void;
  editAllowed(dashboard: string, editToken: string, successCallback: () => void, errorCallback: (error: string) => void): void;
  onEventCollectionsChanged(dashboard: string, successCallback: (collections: Array<RepositoryEventCollectionData>) => void, errorCallback: () => void): () => void;
  setEventCollection(dashboard: string, eventCollection: EventCollection): void;
  addEventCollection(dashboard: string, collectionData: {title: string}): void;
  deleteEventCollection(dashboard: string, key: string): void;
  duplicateEventCollection(dashboard: string, key: string): void;
  overwriteEventCollections(dashboard: string, collections: Array<EventCollection>): void;
  addEvent(dashboard: string, collection: string, eventData: EventData): void;
  deleteEvent(dashboard: string, collection: string, key: string): void;
}


export interface UserEventRepository {
  getUserData(dashboard: string, eventCollection: string, event: string): RepositoryUserEventData;
  setUserData(dashboard: string, eventCollection: string, event: string, isFavorite: boolean): void;
}