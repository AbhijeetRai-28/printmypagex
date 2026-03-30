import mongoose, { type Mongoose } from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_TIMEOUT_MS = Number(process.env.MONGODB_TIMEOUT_MS || 5000)

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

const mongoUri = MONGODB_URI

type MongooseCache = {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached = globalThis.mongooseCache ?? { conn: null, promise: null }

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached
}

export async function connectDB() {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn
  }

  if (cached.conn && cached.conn.connection.readyState !== 1) {
    cached.conn = null
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: MONGODB_TIMEOUT_MS,
        connectTimeoutMS: MONGODB_TIMEOUT_MS
      })
      .catch((error) => {
        cached.promise = null
        throw error
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}
