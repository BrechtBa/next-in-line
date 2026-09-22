export type EventData = {
  title: string;
  plannedStartDate: Date;
  plannedFinishDate: Date | null;
  startDate: Date | null;
  finishDate: Date | null;
  started: boolean;
  finished: boolean;
}


export class Event {
  key: string;
  title: string;
  plannedStartDate: Date;
  plannedFinishDate: Date | null;
  startDate: Date | null;
  finishDate: Date | null;
  started: boolean;
  finished: boolean;

  constructor(key: string, args: EventData) {
    this.key = key;
    this.title = args.title;
    this.plannedStartDate = args.plannedStartDate || new Date();
    this.plannedFinishDate = args.plannedFinishDate || null;
    this.startDate = args.startDate || null
    this.finishDate = args.finishDate || null
    this.started = args.started || false;
    this.finished = args.finished || false;
  }

  start() {
    return new Event(this.key, {
      title: this.title, plannedStartDate: this.plannedStartDate, plannedFinishDate: this.plannedFinishDate,
      startDate: new Date(), finishDate: this.finishDate, started: true, finished: false
    });
  }

  finish() {
    return new Event(this.key, {
      title: this.title, plannedStartDate: this.plannedStartDate, plannedFinishDate: this.plannedFinishDate,
      startDate: this.startDate, finishDate: new Date(), started: true, finished: true
    });
  }

  update(eventData: EventData) {
    if (eventData.started && (eventData.startDate === undefined || eventData.startDate === null) && this.startDate === null ){
      eventData.startDate = new Date();
    }

    return new Event(this.key, {
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

  getDuration(): number {
    if(this.finished && this.finishDate !== null && this.startDate !== null){
      return this.finishDate.getTime() - this.startDate.getTime();
    }
    if(this.started && this.startDate !== null){
      const now = new Date();
      return now.getTime() - this.startDate.getTime();
    }
    else {
      return 0;
    }
  }

  getStartDate(): Date {
    if(this.started && this.startDate !== null){
      return this.startDate;
    }
    return this.plannedStartDate;
  }

  static fromObject(key: string, obj: EventData) {
    return new Event(key, {
      title: obj.title,
      plannedStartDate: new Date(obj.plannedStartDate),
      plannedFinishDate: obj.plannedFinishDate === null ? null : new Date(obj.plannedFinishDate),
      startDate: obj.startDate === null ? null : new Date(obj.startDate),
      finishDate: obj.finishDate === null ? null : new Date(obj.finishDate),
      started: obj.started,
      finished: obj.finished
    })
  }
}


export type EventCollectionData = {
  key: string;
  title: string;
  events: Array<Event>;
  order: number;
}


export class EventCollection {
  key: string;
  title: string;
  events: Array<Event>;
  order: number;

  constructor(args: EventCollectionData) {
    this.key = args.key;
    this.title = args.title;
    this.events = args.events;
    this.order = args.order;
  }

  addEvent(event: Event): EventCollection {
    let events = [...this.events];
    events.push(event)
    return new EventCollection({key: this.key, title: this.title, events: events, order: this.order});
  }

  update(collectionData: {title?: string, order?: number}) {
    return new EventCollection({
      key: this.key,
      title: collectionData.title || this.title,
      order: collectionData.order || this.order,
      events: [...this.events]
    });
  }

  getEvents(finished: boolean) {
    return this.events.filter(e => finished || !e.finished ).sort(this.eventSorting);
  }

  eventSorting(a: Event, b: Event) {
    if(a.plannedStartDate < b.plannedStartDate) {
      return -1;
    }
    return 1;
  }

  static fromObject(obj: EventCollectionData) {
    return new EventCollection({
      key: obj.key,
      title: obj.title,
      order: obj.order,
      events: obj.events.map(event => Event.fromObject(event.key, event))
    })

  }
}


export interface UserEventData {
  dashboard: string;
  eventCollection: string;
  event: string;
  isFavorite: boolean;
}