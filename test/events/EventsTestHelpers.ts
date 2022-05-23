// The event names should be unique across all events in all modules.
const names: string[] = [];

export function ensureUnique(namespace: string, src: any): void {
  for (const [key, value] of Object.entries(src)) {
    const typedValue = value as string;
    if (typeof typedValue !== 'string') {
      return;
    }
    if (names.includes(typedValue)) {
      throw new Error(`${namespace}.${key} has duplicated event name ${typedValue}`);
    }
    names.push(typedValue);
  }
}
