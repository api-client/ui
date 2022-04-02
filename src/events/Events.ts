import { AuthEvents } from './AuthEvents.js';
import { ConfigEvents } from './ConfigEvents.js';
import { StoreEvents } from './StoreEvents.js';

export const Events = Object.freeze({
  Auth: AuthEvents,
  Config: ConfigEvents,
  Store: StoreEvents,
});
