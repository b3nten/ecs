let proxyCache = new WeakMap();
export function createDeepOnChangeProxy<T>(target: T) {
  return new Proxy(target, {
    get(target, property) {
      const item = target[property];
      if (item && typeof item === 'object') {
        if (proxyCache.has(item)) return proxyCache.get(item);
        const proxy = createDeepOnChangeProxy(item, onChange);
        proxyCache.set(item, proxy);
        return proxy;
      }
      return item;
    },
    set(target, property, newValue) {
      validate(schema, newValue);
      target[property] = newValue;
      return true;
    },
  });
}