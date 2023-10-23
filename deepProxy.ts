import { validate } from './struct.ts';

let proxyCache = new WeakMap();

export function createDeepOnChangeProxy<T>(target: T, schema: object, quiet = false) {
  return new Proxy(target, {
    get(target, property) {
      const item = target[property];
      if (item && typeof item === 'object') {
        if (proxyCache.has(item)) return proxyCache.get(item);
        const proxy = createDeepOnChangeProxy(item, schema[property]);
        proxyCache.set(item, proxy);
        return proxy;
      }
      return item;
    },
    set(target, property, newValue) {
      if (!validate(schema[property], newValue, true)) return quiet;
      target[property] = newValue;
      return true;
    },
  });
}