import { ConfigEvents } from './ConfigEvents.js';
import { NavigationEvents } from './NavigationEvents.js';
import { StoreEvents } from './StoreEvents.js';
import { HttpProjectEvents } from './HttpProjectEvents.js';

export const Events = Object.freeze({
  Config: ConfigEvents,
  Navigation: NavigationEvents,
  Store: StoreEvents,
  HttpProject: HttpProjectEvents,
});
