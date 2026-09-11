import { MongoClient, type Collection, type Db } from 'mongodb';
import { RAG_CONFIG } from './config';
import type { DocumentChunk } from './types';

/**
 * MongoDB connection singleton.
 * Re-uses the same client across hot reloads in development.
 */

// Extend the global type so the cached client survives HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

function getMongoURI(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Add it to your .env.local file.'
    );
  }
  return uri;
}

function getClient(): MongoClient {
  if (process.env.NODE_ENV === 'development') {
    // In dev, reuse the client across hot reloads
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(getMongoURI());
    }
    client = global._mongoClient;
  } else {
    if (!client) {
      client = new MongoClient(getMongoURI());
    }
  }
  return client;
}

/** Get the MongoDB database */
export function getDatabase(): Db {
  return getClient().db(RAG_CONFIG.mongodb.database);
}

/** Get the chunks collection with proper typing */
export function getChunksCollection(): Collection<DocumentChunk> {
  return getDatabase().collection<DocumentChunk>(RAG_CONFIG.mongodb.collection);
}

/** Connect to MongoDB (call during server startup or ingestion) */
export async function connectToMongoDB(): Promise<MongoClient> {
  const c = getClient();
  await c.connect();
  return c;
}

/** Close the MongoDB connection */
export async function closeMongoDB(): Promise<void> {
  const c = getClient();
  await c.close();
  if (process.env.NODE_ENV === 'development') {
    global._mongoClient = undefined;
  }
}
