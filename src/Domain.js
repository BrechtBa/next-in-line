

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
    if (eventData.started && (eventData.startDate === undefined || eventData.startDate === null) && this.startDate === null ){
      eventData.startDate = new Date();
    }

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
    if(this.finished){
      return this.finishDate - this.startDate;
    }
    if(this.started){
      const now = new Date();
      return now - this.startDate;
    }
    else {
      return 0;
    }
  }

  getStartDate() {
    if(this.started){
      return this.startDate;
    }
    return this.plannedStartDate;
  }

}


export class EventCollection {
  key: string
  title: string
  events: Object
  order: number

  constructor(args: object) {
    this.key = args.key;
    this.title = args.title;
    this.events = args.events;
    this.order = args.order;
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
      order: collectionData.order || this.order,
      events: [...this.events]
    });
  }

  getEvents(finished: bool) {
    return this.events.filter(e => finished || !e.finished ).sort(this.eventSorting);
  }

  eventSorting(a, b) {
    if(a.plannedStartDate < b.plannedStartDate) {
      return -1;
    }
    return 1;
  }

}
