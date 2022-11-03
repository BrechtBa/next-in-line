import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push} from "firebase/database";

//import auth from "firebase/auth";
//import 'firebase/storage';


import {EventCollection, Event} from '../Domain.js'

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

//export const auth = auth();
export const db = getDatabase(app);
//export const storage = firebase.storage();


export class FirebaseEventRepository{

  constructor(db) {
    this.db = db;
  }

  onTokenChanged(tenant, callback) {
     return onValue(ref(this.db, `tenantData/${tenant}/editToken`), snapshot => {
       if (snapshot !== undefined){
          callback(snapshot.val());
       }
     }, {});
  }

  onEventCollectionsChanged(tenant, callback) {
    return onValue(ref(this.db, `tenantData/${tenant}/collections`), snapshot => {

      if (snapshot !== undefined){
        const collections = Object.entries(snapshot.val() || {}).map( col => {
          const events = Object.entries(col[1].events || []).map( val => {
            return new Event({
              key: val[0],
              title: val[1].title,
              plannedStartDate: val[1].plannedStartDate === undefined ? new Date() : new Date(val[1].plannedStartDate),
              plannedFinishDate: val[1].plannedFinishDate === undefined ? null : new Date(val[1].plannedFinishDate),
              startDate: val[1].startDate === undefined ? null : new Date(val[1].startDate),
              finishDate: val[1].finishDate === undefined ? null : new Date(val[1].finishDate),
              started: val[1].started,
              finished: val[1].finished
            })
          })
          return new EventCollection({key: col[0], title: col[1].title, events: events})
        });
        callback(collections);
      }
    }, {});
  }


  addTenant(tenant: string, editToken: string) {
    set(ref(this.db, `tenantData/${tenant}/editToken`), editToken)
  }


  setEventCollection(tenant, collection) {
    let events = {}
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

    set(ref(this.db, `tenantData/${tenant}/collections/${collection.key}`), {
      title: collection.title,
      events: events
    })
  }

  addEventCollection(tenant, collectionData) {
    push(ref(this.db, `tenantData/${tenant}/collections`), {
      title: collectionData.title || 'New collection'
    });
  }

  deleteEventCollection(tenant, key) {
      set(ref(this.db, `tenantData/${tenant}/collections/${key}`), null);
  }

  addEvent(tenant, collection, eventData) {
    push(ref(this.db, `tenantData/${tenant}/collections/${collection.key}/events`), {
      title: eventData.title,
      plannedStartDate: eventData.plannedStartDate.getTime(),
      plannedFinishDate: eventData.plannedFinishDate === null ? null : eventData.plannedFinishDate.getTime(),
      startDate: eventData.startDate === null ? null : eventData.startDate.getTime(),
      finishDate: eventData.finishDate === null ? null : eventData.finishDate.getTime(),
      started: eventData.started,
      finished: eventData.finished,
    });
  }

  deleteEvent(tenant, collection, key) {
      set(ref(this.db, `tenantData/${tenant}/collections/${collection.key}/events/${key}`), null);
  }

}

export const getRepository = () => {
  const api = new FirebaseEventRepository(db);
  return api;
}