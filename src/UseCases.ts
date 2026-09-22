import { Event, EventCollection, type EventCollectionData, type EventData } from "./Domain";
import { getRepository } from "./repository/firebase";
import { getRepository as getUserDataRepository } from "./repository/userEvent";
import type { EventRepository, UserEventRepository } from "./repository/interface";


function generateString(length: number) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
};

export class CouldNotParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouldNotParseError";
    Object.setPrototypeOf(this, CouldNotParseError.prototype);
  }
};

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
    Object.setPrototypeOf(this, ImportError.prototype);
  }
};


class UseCases {
  repository: EventRepository;
  userDataRepository: UserEventRepository;

  constructor(repository: EventRepository, userDataRepository: UserEventRepository){
    this.repository = repository;
    this.userDataRepository = userDataRepository;
  }

  addDashboard(callback: (dashboard: string, editToken: string) => void, errorCallback: (error: string) => void) {
    const dashboard = generateString(8)
    const editToken = generateString(8)
    this.repository.addDashboard(dashboard, editToken, callback, errorCallback);
  }

  getDashboardAdminLink(dashboard: string | undefined, editToken: string | undefined): string {
    if(dashboard === undefined || editToken === undefined) {
      return ""
    }
    return `${window.location.origin}/${dashboard}/${editToken}`
  }

  getDashboardViewLink(dashboard: string | undefined): string {
    if(dashboard === undefined) {
      return ""
    }
    return `${window.location.origin}/${dashboard}`
  }

  editAllowed(dashboard: string, editToken: string, successCallback: () => void, errorCallback: (error: string) => void) {
    this.repository.editAllowed(dashboard, editToken, successCallback, errorCallback);
  }

  setEvent(dashboard: string, eventCollection: EventCollection, event: Event): EventCollection {
    const newEvents = eventCollection.events.map(e => {
      if(e.key === event.key) {
        return event;
      }
      return e;
    })

    const newCollection = new EventCollection({
      key: eventCollection.key,
      title: eventCollection.title,
      order: eventCollection.order,
      events: newEvents
    });
    this.repository.setEventCollection(dashboard, newCollection);
    return newCollection
  }

  deleteEvent(dashboard: string, eventCollection: string, key: string): void {
    this.repository.deleteEvent(dashboard, eventCollection, key);
  }

  addEvent(dashboard: string, eventCollection: string, eventData: EventData): void {
    this.repository.addEvent(dashboard, eventCollection, eventData);
  }

  setEventCollection(dashboard: string, collection: EventCollection): void {
    this.repository.setEventCollection(dashboard, collection);
  }
  
  addEventCollection(dashboard: string, collectionData: {title: string}) {
    this.repository.addEventCollection(dashboard, collectionData)
  }

  deleteEventCollection(dashboard: string, key: string): void {
    this.repository.deleteEventCollection(dashboard, key);
  }

  duplicateEventCollection(dashboard: string, eventCollection: string): void {
    this.repository.duplicateEventCollection(dashboard, eventCollection);
  }

  importEventCollections(dashboard: string, val: string): void {
    try {
      const data = JSON.parse(val);
      try {
        const eventCollections = data.map((e: EventCollectionData) => EventCollection.fromObject(e));
        try {
          this.repository.overwriteEventCollections(dashboard, eventCollections);
          return
        }
        catch (e){
          throw new ImportError("");
        }
      }
      catch(e) {
        throw new CouldNotParseError("");
      }
    }
    catch(e) {
      throw new InvalidInputError("");
    }
    
    
  }

  overwriteEventCollections(dashboard: string, collections: Array<EventCollection>): void {
    this.repository.overwriteEventCollections(dashboard, collections);
  }

  onEventCollectionsChanged(dashboard: string, successCallback: (collections: Array<EventCollection>) => void, errorCallback: () => void): void {
    this.repository.onEventCollectionsChanged(dashboard, successCallback, errorCallback);
  }

  getEventIsFavorite(dashboard: string, eventCollection: string, event: string): boolean {
    return this.userDataRepository.getUserData(dashboard, eventCollection, event).isFavorite;
  }

  setEventIsFavorite(dashboard: string, eventCollection: string, event: string, isFavorite: boolean): void {
    this.userDataRepository.setUserData(dashboard, eventCollection, event, isFavorite);
  }

};


export const useCases = new UseCases(getRepository(), getUserDataRepository())