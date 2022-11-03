

export class Event {
  key: string;
  title: string;
  plannedStartDate: Date;
  plannedFinishDate: Date;
  startDate: Date;
  finishDate: Date;
  started: boolean;
  finished: boolean;

  constructor(args: object) {
    this.key = args.key;
    this.title = args.title;
    this.plannedStartDate = args.plannedStartDate || new Date();
    this.plannedFinishDate = args.plannedFinishDate || null;
    this.startDate = args.startDate || null
    this.finishDate = args.finishDate || null
    this.started = args.started || false;
    this.finished = args.finished || false;
  }

  start() {
    return new Event({
      key: this.key, title: this.title, plannedStartDate: this.plannedStartDate, plannedFinishDate: this.plannedFinishDate,
      startDate: new Date(), finishDate: this.finishDate, started: true, finished: false
    });
  }

  finish() {
    return new Event({
      key: this.key, title: this.title, plannedStartDate: this.plannedStartDate, plannedFinishDate: this.plannedFinishDate,
      startDate: this.startDate, finishDate: new Date(), started: true, finished: true
    });
  }


  update(eventData: object) {
    return new Event({
      key: this.key,
      ...{
        title: this.title,
        plannedStartDate: this.plannedStartDate,
        plannedFinishDate: this.plannedFinishDate,
        startDate: this.startDate,
        finishDate: this.finishDate,
        started: this.started,
        finished: this.finished
      },
      ...eventData
    });
  }

  getDuration() {
    if(this.started){
      const now = new Date();
      return now - this.startDate;
    }
    if(this.finished){
      return this.finishDate - this.startDate;
    }
    else {
      return 0;
    }
  }
}


export class EventCollection {
  key: string
  title: string
  events: Object

  constructor(args: object) {
    this.key = args.key;
    this.title = args.title;
    this.events = args.events;
  }

  addEvent(event) {
    let events = [...this.events];
    events.push(event)
    return EventCollection(this.key, this.title, events);
  }

  removeEvent(key) {
    console.log('removing is not implemented yet')
  }

  update(collectionData: object) {
    return new EventCollection({
      key: this.key,
      title: collectionData.title || this.title,
      events: [...this.events]
    });
  }

  getAllEvents() {
    return this.events.sort(this.eventSorting);
  }

  getActiveEvents() {
    return this.events.filter(e => !e.finished ).sort(this.eventSorting);
  }

  eventSorting(a, b) {
    if(a.startDate < b.startDate) {
      return 1;
    }
    return -1;
  }

}
