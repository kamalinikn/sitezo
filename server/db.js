import mongoose from 'mongoose';

// Fail fast instead of queueing queries when there is no connection.
mongoose.set('bufferCommands', false);

// The cache lives on globalThis so warm serverless invocations reuse one connection.
const cache = (globalThis.__sitezoMongo ||= { promise: null });

export function connectDB() {
  if (!process.env.MONGO_URI) return Promise.reject(new Error('MONGO_URI is not set'));
  const state = mongoose.connection.readyState; // 0 off, 1 connected, 2 connecting
  if (state === 1) return Promise.resolve(mongoose);
  if (state === 0) cache.promise = null; // never connected, or the connection dropped
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .catch((e) => { cache.promise = null; throw e; });
  }
  return cache.promise;
}
