import { ConfigEvents } from './ConfigEvents.js';
import { NavigationEvents } from './NavigationEvents.js';
import { StoreEvents } from './StoreEvents.js';
import { HttpProjectEvents } from './HttpProjectEvents.js';
import { AppDataEvents } from './AppDataEvents.js';

export const Events = Object.freeze({
  AppData: AppDataEvents,
  Config: ConfigEvents,
  Navigation: NavigationEvents,
  Store: StoreEvents,
  HttpProject: HttpProjectEvents,
});
