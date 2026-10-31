export type EventData = {
  title: string;
  plannedStartDate: Date;
  plannedFinishDate: Date | null;
  startDate: Date | null;
  finishDate: Date | null;
  started: boolean;
  finished: boolean;
  isFavorite: boolean;
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
  isFavorite: boolean;
  
  constructor(key: string, args: EventData) {
    this.key = key;
    this.title = args.title;
    this.plannedStartDate = args.plannedStartDate || new Date();
    this.plannedFinishDate = args.plannedFinishDate || null;
    this.startDate = args.startDate || null
    this.finishDate = args.finishDate || null
    this.started = args.started || false;
    this.finished = args.finished || false;
    this.isFavorite = args.isFavorite || false;
  }

  start() {
    return new Event(this.key, {
      title: this.title, plannedStartDate: this.plannedStartDate, plannedFinishDate: this.plannedFinishDate,
      startDate: new Date(), finishDate: this.finishDate, started: true, finished: false, isFavorite: this.isFavorite,
    });
  }

  finish() {
    return new Event(this.key, {
      title: this.title, plannedStartDate: this.plannedStartDate, plannedFinishDate: this.plannedFinishDate,
      startDate: this.startDate, finishDate: new Date(), started: true, finished: true, isFavorite: this.isFavorite,
    });
  }

  update(eventData: Partial<EventData>) {
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
        finished: this.finished,
        isFavorite: this.isFavorite,
      },
      ...eventData
    });
  }

  getDurationMs(): number {
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
      finished: obj.finished,
      isFavorite: obj.isFavorite,
    })
  }
}


export type EventCollectionData = {
  key: string;
  title: string;
  events: Array<Event>;
  order: number;
}


export class EventInCollection extends Event {
  expectedDelayOffsetDate: Date | null;
  expectedDelayMs: number | null;
  eventsToGo: number;

  constructor(key: string, args: EventData, expectedDelayOffsetDate: Date | null, expectedDelayMs: number | null, eventsToGo: number){
    super(key, args);
    this.expectedDelayOffsetDate = expectedDelayOffsetDate;
    this.expectedDelayMs = expectedDelayMs
    this.eventsToGo = eventsToGo;
  }

  /*
  expectedDelay:
    if there are no started events in the collection
      return 0
    
    get all not started events before this one.
      if now > event[0].plannedStartDate:
        return now - event[0].plannedStartDate - 0.05 * full_events_duration
      return 0 


  delay = now - event[0].plannedStartDate - 0.05 * full_events_duration
  */

  getDelayMs(): number {
    if(this.expectedDelayMs !== null) {
      return this.expectedDelayMs;
    }
    if(this.expectedDelayOffsetDate === undefined || this.expectedDelayOffsetDate === null) {
      return 0;
    }
    const now = this.started ? this.startDate : new Date();
    const seconds =  now.getTime() - this.expectedDelayOffsetDate.getTime();
    return seconds > 0 ? seconds : 0;
  }

}


export type EventDTO = {
  event: Event;
  expectedDelayMs: number;
  eventsToGo: number;
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

  update(collectionData: {title?: string, order?: number}) {
    return new EventCollection({
      key: this.key,
      title: collectionData.title || this.title,
      order: collectionData.order || this.order,
      events: [...this.events]
    });
  }

  getEvents(finished: boolean): Array<EventInCollection> {
    const sortedEvents = this.events.sort(this.eventSorting);

    const now = new Date().getTime();

    const calculateOffsetDate = (e: Event): number => {
      return e.plannedStartDate.getTime() - now
    }
    const offsetDateEvent = sortedEvents.filter(e => !e.finished).reduce(
      (acc, e) => calculateOffsetDate(e) < acc.delta ? {event: e, date: calculateOffsetDate(e)} : acc, {event: null, delta: 1e9}
    );

    const calculateDelay = (e: Event): number => {
      return e.startDate.getTime() - e.plannedStartDate.getTime()
    }
    const delayMsEvent = sortedEvents.filter(e => !e.finished && e.started).reduce(
      (acc, e) => calculateDelay(e) > acc.delay ? {event: e, delay: calculateDelay(e)} : acc, {event: null, delay: null}
    );
    const pendingEvents = sortedEvents.reduce(
      (acc, e) => ({...acc, [e.key]: acc.pending, pending: acc.pending + (e.finished ? 0 : 1)}), {pending: 0}
    );
    return sortedEvents.filter(e => finished || !e.finished).map(e => new EventInCollection(e.key, e, offsetDateEvent.event?.plannedStartDate, delayMsEvent.delay, pendingEvents[e.key] || 0));
  }

  private eventSorting(a: Event, b: Event) {
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
