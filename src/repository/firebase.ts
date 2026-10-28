import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, get, runTransaction, Database} from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, type Auth } from "firebase/auth";

import {EventCollection, type EventData} from '../Domain.js'
import type { EventRepository, RepositoryEventCollectionData } from "./interface.js";


type EventDTO = {
  title: string;
  plannedStartDate: number | null;
  plannedFinishDate?: number | null;
  startDate?: number | null;
  finishDate?: number | null;
  started: boolean;
  finished: boolean;
}


type CollectionDTO = {
  title: string;
  events: {
    [key: string]: EventDTO;
  },
  order: number,
}


export class FirebaseEventRepository implements EventRepository{
  db: Database;
  auth: Auth;

  constructor(db: Database, auth: Auth) {
    this.db = db;
    this.auth = auth;
  }

  getDashboardEmail(dashboard: string) {
    return `${dashboard}@next-in-line.org`
  }

  addDashboard(dashboard: string, editToken: string, callback: (dashboard: string, editToken: string) => void, errorCallback: (error: string) => void) {
    createUserWithEmailAndPassword(this.auth, this.getDashboardEmail(dashboard) , editToken).then((userCredential) => {
      // user account created, initialize dashboard
      set(ref(this.db, `dashboardData/${dashboard}/uid`), userCredential.user.uid);
      set(ref(this.db, `dashboardData/${dashboard}/exists`), true);
      callback(dashboard, editToken)
    }).catch((error) => {
      errorCallback(error)
    });
  }

  editAllowed(dashboard: string, editToken: string, successCallback: () => void, errorCallback: (error: string) => void): void {
    signInWithEmailAndPassword(this.auth, this.getDashboardEmail(dashboard) , editToken).then(() => {
      successCallback();
    }).catch((error) => {
      errorCallback(error);
    });
  }

  onEventCollectionsChanged(dashboard: string, successCallback: (collections: Array<RepositoryEventCollectionData>) => void, errorCallback: () => void): () => void {
    // check if the dashboard exists, we cannot depend on the collections query here as a dashboard can have no collections
    let unsubscribe = () => {};
    get(ref(this.db, `dashboardData/${dashboard}/exists`)).then((snapshot) => {
      if (snapshot !== undefined){
        if(snapshot.val() === null){
          errorCallback()
          return
        }

        unsubscribe = onValue(ref(this.db, `dashboardData/${dashboard}/collections`), snapshot => {
          if (snapshot !== undefined){

            const data = snapshot.val() || {} as {[key: string]: {title: string, events: {[key: string]: EventDTO}, order: number}};

            const collections = Object.keys(data).map(collectionKey => {
              const events = Object.keys(data[collectionKey].events || {}).map(eventKey => {
                return {
                  key: eventKey,
                  title: data[collectionKey].events[eventKey].title,
                  plannedStartDate: data[collectionKey].events[eventKey].plannedStartDate === undefined ? new Date() : new Date(data[collectionKey].events[eventKey].plannedStartDate),
                  plannedFinishDate: data[collectionKey].events[eventKey].plannedFinishDate === undefined ? null : new Date(data[collectionKey].events[eventKey].plannedFinishDate),
                  startDate: data[collectionKey].events[eventKey].startDate === undefined ? null : new Date(data[collectionKey].events[eventKey].startDate),
                  finishDate: data[collectionKey].events[eventKey].finishDate === undefined ? null : new Date(data[collectionKey].events[eventKey].finishDate),
                  started: data[collectionKey].events[eventKey].started,
                  finished: data[collectionKey].events[eventKey].finished
                }
              });
              return {key: collectionKey, title: data[collectionKey].title, events: events, order: data[collectionKey].order}
            });
            collections.sort((a, b) => a.order-b.order);
            successCallback(collections);
          }
        }, {});

      }
      else{
        errorCallback()
        return
      }
    });

    // FIXME this returns immediately and never really unsubscribes
    return unsubscribe;
  }

  setEventCollection(dashboard: string, collection: EventCollection) {
    let events: {[key: string]: EventDTO} = {};
    
    collection.events.forEach(e => {
      events[e.key] = {
        title: e.title,
        plannedStartDate: e.plannedStartDate.getTime(),
        plannedFinishDate: e.plannedFinishDate === null ? null : e.plannedFinishDate.getTime(),
        startDate: e.startDate === null ? null : e.startDate.getTime(),
        finishDate: e.finishDate === null ? null : e.finishDate.getTime(),
        started: e.started,
        finished: e.finished,
      }
    })

    set(ref(this.db, `dashboardData/${dashboard}/collections/${collection.key}`), {
      title: collection.title,
      events: events,
      order: collection.order,
    })
  }

  addEventCollection(dashboard: string, collectionData: {title: string}) {
    push(ref(this.db, `dashboardData/${dashboard}/collections`), {
      title: collectionData.title || 'New collection',
      order: 1000,  //  more than 1000 collections is not allowed
    });

    // correct the order
    runTransaction(ref(this.db, `dashboardData/${dashboard}/collections`), (collections) => {
      if (collections){
        // make collection order sequential
        let collectionKeys = []
        for (let k in collections) {
          collectionKeys.push(k);
        }
        collectionKeys.sort((a, b) => collections[a].order - collections[b].order);

        collectionKeys.forEach((k, index) => {
          collections[k].order = index;
        })
      }
      return collections;
    });

  }

  deleteEventCollection(dashboard: string, key: string) {
    set(ref(this.db, `dashboardData/${dashboard}/collections/${key}`), null);
  }

  duplicateEventCollection(dashboard: string, key: string) {

    // push a temporary collection
    const newKey = push(ref(this.db, `dashboardData/${dashboard}/collections`)).key;

    runTransaction(ref(this.db, `dashboardData/${dashboard}/collections`), (collections) => {
      if (collections){
        // make collection order sequential
        let collectionKeys = []
        for (let k in collections) {
          collectionKeys.push(k);
        }
        collectionKeys.sort((a, b) => collections[a].order - collections[b].order);

        collectionKeys.forEach((k, index) => {
          collections[k].order = index;
        })

        // the order of the collection to duplicate
        const collectionOrder = collections[key].order || 0
        // update orders to make room for the new collection
        for (let k in collections) {
          if(collections[k].order > collectionOrder){
            collections[k].order += 1;
          }
          collections[newKey] = JSON.parse(JSON.stringify(collections[key]));
          collections[newKey].order += 1;
        }

      }
      return collections;
    });
  }

  addEvent(dashboard: string, collection: string, eventData: EventData) {
    push(ref(this.db, `dashboardData/${dashboard}/collections/${collection}/events`), {
      title: eventData.title,
      plannedStartDate: eventData.plannedStartDate.getTime(),
      plannedFinishDate: eventData.plannedFinishDate === null ? null : eventData.plannedFinishDate.getTime(),
      startDate: eventData.startDate === null ? null : eventData.startDate.getTime(),
      finishDate: eventData.finishDate === null ? null : eventData.finishDate.getTime(),
      started: eventData.started,
      finished: eventData.finished,
    });
  }

  deleteEvent(dashboard: string, collection: string, key: string) {
    set(ref(this.db, `dashboardData/${dashboard}/collections/${collection}/events/${key}`), null);
  }

  overwriteEventCollections(dashboard: string, collections: Array<EventCollection>){
    runTransaction(ref(this.db, `dashboardData/${dashboard}/collections`), () => {
      let collectionsObject: {[key: string]: CollectionDTO} = {};
      collections.forEach((collection) => {

        let events: {[key: string]: EventDTO} = {};

        collection.events.forEach(e => {
          events[e.key] = {
            title: e.title,
            plannedStartDate: e.plannedStartDate.getTime(),
            plannedFinishDate: e.plannedFinishDate === null ? null : e.plannedFinishDate.getTime(),
            startDate: e.startDate === null ? null : e.startDate.getTime(),
            finishDate: e.finishDate === null ? null : e.finishDate.getTime(),
            started: e.started,
            finished: e.finished,
          }
        })
        collectionsObject[collection.key] = {
          title: collection.title,
          events: events,
          order: collection.order,
        };
      });
      return collectionsObject;
    });
  }

}

export const getRepository = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyDizW1xfS25fDSpMTDkGBoVM_pmI6ADc5s",
    authDomain: "next-in-line-d11ab.firebaseapp.com",
    databaseURL: "https://next-in-line-d11ab-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "next-in-line-d11ab",
    storageBucket: "next-in-line-d11ab.appspot.com",
    messagingSenderId: "718215694573",
    appId: "1:718215694573:web:948e184c1ba0d5ef2624e4"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);

  return new FirebaseEventRepository(db, auth);
}