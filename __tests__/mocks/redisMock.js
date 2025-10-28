const mockRedis = {
  store: new Map(),
  connected: true,
  events: new Map(),

  connect() { return Promise.resolve(mockRedis); },
  quit() {
    mockRedis.connected = false;
    return Promise.resolve();
  },
  disconnect() {
    mockRedis.connected = false;
    return Promise.resolve();
  },
  duplicate() { return mockRedis; },

  on(event, callback) {
    if (!mockRedis.events.has(event)) {
      mockRedis.events.set(event, []);
    }
    mockRedis.events.get(event).push(callback);
    return mockRedis;
  },
  emit(event, ...args) {
    const callbacks = mockRedis.events.get(event) || [];
    callbacks.forEach(cb => cb(...args));
  },
  off() { return mockRedis; },
  once() { return mockRedis; },

  get(key) { return Promise.resolve(mockRedis.store.get(key)); },
  set(key, value, ...args) {
    let opts = {};
    if (args.length === 1 && typeof args[0] === 'object') {
      opts = args[0];
    } else if (args.length === 2 && args[0] === 'EX') {
      opts = { EX: args[1] };
    }
    
    mockRedis.store.set(key, value);
    if (opts.EX) {
      setTimeout(() => mockRedis.store.delete(key), opts.EX * 1000);
    }
    return Promise.resolve('OK');
  },

  incr(key) {
    const val = (parseInt(mockRedis.store.get(key)) || 0) + 1;
    mockRedis.store.set(key, val.toString());
    return Promise.resolve(val);
  },
  decr(key) {
    const val = (parseInt(mockRedis.store.get(key)) || 0) - 1;
    mockRedis.store.set(key, val.toString());
    return Promise.resolve(val);
  },
  expire(key, seconds) {
    if (mockRedis.store.has(key)) {
      setTimeout(() => mockRedis.store.delete(key), seconds * 1000);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  },

  del(key) {
    const deleted = mockRedis.store.delete(key);
    return Promise.resolve(deleted ? 1 : 0);
  },
  exists(key) { 
    return Promise.resolve(mockRedis.store.has(key) ? 1 : 0); 
  },
  flushAll() { 
    mockRedis.store.clear(); 
    return Promise.resolve('OK'); 
  },

  reset() {
    mockRedis.store.clear();
    mockRedis.events.clear();
    mockRedis.connected = true;
  }
};

const createClient = () => mockRedis;

module.exports = mockRedis;
module.exports.createClient = createClient;
module.exports.default = createClient;
module.exports.RedisClient = () => mockRedis;
module.exports.Redis = () => mockRedis;
module.exports.Cluster = () => mockRedis;