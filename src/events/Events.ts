import { AuthEvents } from './AuthEvents.js';
import { ConfigEvents } from './ConfigEvents.js';
import { NavigationEvents } from './NavigationEvents.js';
import { StoreEvents } from './StoreEvents.js';

export const Events = Object.freeze({
  Auth: AuthEvents,
  Config: ConfigEvents,
  Navigation: NavigationEvents,
  Store: StoreEvents,
});
