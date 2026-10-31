import { Event, EventCollection, type EventCollectionData, type EventData } from "./Domain";
import { getRepository } from "./repository/firebase";
import { getRepository as getUserDataRepository } from "./repository/userEvent";
import type { EventRepository, RepositoryEventCollectionData, UserEventRepository } from "./repository/interface";


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

  onEventCollectionChangedUnsubscribers: {[key: string]: {callback: (c: Array<EventCollection>) => void, unsubscribe: () => void}};
  repositoryCollectionData: Array<RepositoryEventCollectionData>;

  constructor(repository: EventRepository, userDataRepository: UserEventRepository){
    this.repository = repository;
    this.userDataRepository = userDataRepository;

    this.onEventCollectionChangedUnsubscribers = {};
    this.repositoryCollectionData = [];
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


  getNewEventData(eventCollection: EventCollection): EventData {
   
    let plannedStartDate = new Date();
    if(eventCollection.events.length > 0) {

      const sortedEvents = eventCollection.events.sort((a, b) => a.plannedStartDate > b.plannedStartDate ? 1 : -1)
      const differences = sortedEvents.map(
        (_, i) => i === 0 ? 10*60000 : sortedEvents[i].plannedStartDate.getTime() - sortedEvents[i-1].plannedStartDate.getTime()
      ).sort();
      const differenceMs = differences[Math.floor(0.5 * differences.length)]

      plannedStartDate = new Date(sortedEvents[sortedEvents.length-1].plannedStartDate.getTime() + differenceMs);
    }

    return {
      title: 'New Event',
      plannedStartDate: plannedStartDate,
      plannedFinishDate: null,
      startDate: null,
      finishDate: null,
      started: false,
      finished: false,
      isFavorite: false,
    }
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

  onEventCollectionsChanged(dashboard: string, successCallback: (collections: Array<EventCollection>) => void, errorCallback: () => void): () => void {
    const callbackKey = generateString(16)

    const unsubscribe = this.repository.onEventCollectionsChanged(dashboard, (repositoryCollectionData: Array<RepositoryEventCollectionData>) => {
      
      this.repositoryCollectionData = repositoryCollectionData;
      successCallback(this.getCollectionsFromRepositoryData(dashboard, repositoryCollectionData))

    }, errorCallback);

    this.onEventCollectionChangedUnsubscribers[callbackKey] = {
      callback: successCallback,
      unsubscribe: () => {
        unsubscribe();
        delete this.onEventCollectionChangedUnsubscribers[callbackKey] ;
      }
    }

    return this.onEventCollectionChangedUnsubscribers[callbackKey].unsubscribe;
  }

  setEventIsFavorite(dashboard: string, eventCollection: string, event: Event, isFavorite: boolean): void {
    this.userDataRepository.setUserData(dashboard, eventCollection, event.key, isFavorite);

    // notify all subscribers
    Object.keys(this.onEventCollectionChangedUnsubscribers).forEach(key => {
      this.onEventCollectionChangedUnsubscribers[key].callback(this.getCollectionsFromRepositoryData(dashboard, this.repositoryCollectionData));
    });
  }

  private getCollectionsFromRepositoryData(dashboard: string, repositoryCollectionData: Array<RepositoryEventCollectionData>): Array<EventCollection> {
    return repositoryCollectionData.map(collectionData => new EventCollection({
        key: collectionData.key,
        title: collectionData.title,
        events: collectionData.events.map(eventData => new Event(eventData.key, {
          title: eventData.title,
          plannedStartDate: eventData.plannedStartDate,
          plannedFinishDate: eventData.plannedFinishDate,
          startDate: eventData.startDate,
          finishDate: eventData.finishDate,
          started: eventData.started,
          finished: eventData.finished,
          isFavorite: this.userDataRepository.getUserData(dashboard, collectionData.key, eventData.key).isFavorite
        })),
        order: collectionData.order,
      }));
  }


};


export const useCases = new UseCases(getRepository(), getUserDataRepository())