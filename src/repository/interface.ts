import type { EventCollection, EventData, UserEventData } from "../Domain";


export interface EventRepository {
  addDashboard(dashboard: string, editToken: string, callback: (dashboard: string, editToken: string) => void, errorCallback: (error: string) => void): void;
  editAllowed(dashboard: string, editToken: string, successCallback: () => void, errorCallback: (error: string) => void): void;
  onEventCollectionsChanged(dashboard: string, successCallback: (collections: Array<EventCollection>) => void, errorCallback: () => void): void;
  setEventCollection(dashboard: string, eventCollection: EventCollection): void;
  addEventCollection(dashboard: string, collectionData: {title: string}): void;
  deleteEventCollection(dashboard: string, key: string): void;
  duplicateEventCollection(dashboard: string, key: string): void;
  overwriteEventCollections(dashboard: string, collections: Array<EventCollection>): void;
  addEvent(dashboard: string, collection: string, eventData: EventData): void;
  deleteEvent(dashboard: string, collection: string, key: string): void;
}


export interface UserEventRepository {
  getUserData(dashboard: string, eventCollection: string, event: string): UserEventData;
  setUserData(dashboard: string, eventCollection: string, event: string, isFavorite: boolean): void;
}