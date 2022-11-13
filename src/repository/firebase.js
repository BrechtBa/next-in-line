import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, get} from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

import {EventCollection, Event} from '../Domain.js'


function generateString(length) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



export class FirebaseEventRepository{

  constructor(db, auth) {
    this.db = db;
    this.auth = auth;
  }

  getDashboardEmail(dashboard) {
    return `${dashboard}@next-in-line.org`
  }

  addDashboard(callback, errorCallback) {
    const dashboard = generateString(8)
    const editToken = generateString(8)

    // create an admin user account
    createUserWithEmailAndPassword(this.auth, this.getDashboardEmail(dashboard) , editToken).then((userCredential) => {
      // user account created, initialize dashboard
      set(ref(this.db, `dashboardData/${dashboard}/uid`), userCredential.user.uid);
      set(ref(this.db, `dashboardData/${dashboard}/exists`), true);
      callback(dashboard, editToken)
    }).catch((error) => {
      errorCallback(error)
    });
  }

  editAllowed(dashboard: string, editToken: string, successCallback, errorCallback) {
    signInWithEmailAndPassword(this.auth, this.getDashboardEmail(dashboard) , editToken).then((userCredential) => {
      successCallback();
    }).catch((error) => {
      errorCallback(error);
    });
  }

  onEventCollectionsChanged(dashboard, successCallback, errorCallback) {
    get(ref(this.db, `dashboardData/${dashboard}/exists`)).then((snapshot) => {
      if (snapshot !== undefined){
        if(snapshot.val() === null){
          errorCallback()
          return
        }
      }
      else{
        errorCallback()
        return
      }
    })

    return onValue(ref(this.db, `dashboardData/${dashboard}/collections`), snapshot => {
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
        successCallback(collections);
      }
    }, {});
  }

  setEventCollection(dashboard, collection) {
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

    set(ref(this.db, `dashboardData/${dashboard}/collections/${collection.key}`), {
      title: collection.title,
      events: events
    })
  }

  addEventCollection(dashboard, collectionData) {
    push(ref(this.db, `dashboardData/${dashboard}/collections`), {
      title: collectionData.title || 'New collection'
    });
  }

  deleteEventCollection(dashboard, key) {
    set(ref(this.db, `dashboardData/${dashboard}/collections/${key}`), null);
  }

  addEvent(dashboard, collection, eventData) {
    push(ref(this.db, `dashboardData/${dashboard}/collections/${collection.key}/events`), {
      title: eventData.title,
      plannedStartDate: eventData.plannedStartDate.getTime(),
      plannedFinishDate: eventData.plannedFinishDate === null ? null : eventData.plannedFinishDate.getTime(),
      startDate: eventData.startDate === null ? null : eventData.startDate.getTime(),
      finishDate: eventData.finishDate === null ? null : eventData.finishDate.getTime(),
      started: eventData.started,
      finished: eventData.finished,
    });
  }

  deleteEvent(dashboard, collection, key) {
    set(ref(this.db, `dashboardData/${dashboard}/collections/${collection.key}/events/${key}`), null);
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