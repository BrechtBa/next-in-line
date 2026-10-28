import type { RepositoryUserEventData, UserEventRepository } from "./interface";



class LocalStorageUserEventRepository implements UserEventRepository {
  setUserData(dashboard: string, eventCollection: string, event: string, isFavorite: boolean): void {
    localStorage.setItem(this.getKey(dashboard, eventCollection, event), JSON.stringify({isFavorite: isFavorite}));
  }
  getUserData(dashboard: string, eventCollection: string, event: string): RepositoryUserEventData {
    const val = localStorage.getItem(this.getKey(dashboard, eventCollection, event));
    if( val === null) {
      return {
        dashboard: dashboard,
        eventCollection: eventCollection,
        event: event,
        isFavorite: false
      }
    }
    return JSON.parse(val) as RepositoryUserEventData;
  }

  private getKey(dashboard: string, eventCollection: string, event: string): string {
    return `${dashboard}.${eventCollection}.${event}`;
  }

}

export const getRepository = () => {
  return new LocalStorageUserEventRepository();
}