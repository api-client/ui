const valuesMap = new WeakMap();

/**
 * Reactive decorator that calls the `render()` function when the value of the property change.
 */
export function reactive() {
  return (protoOrDescriptor: any, name: PropertyKey): any => {
    Object.defineProperty(protoOrDescriptor, name, {
      get() {
        const map = valuesMap.get(this);
        return map[name];
      },
      set(newValue) {
        let map = valuesMap.get(this); 
        if (!map) {
          map = {};
          valuesMap.set(this, map);
        }
        if (map[name] === name) {
          return;
        }
        map[name] = newValue;
        if (typeof this.render === 'function') {
          this.render();
        }
      },
      enumerable: true,
      configurable: true,
    });
  };
}
