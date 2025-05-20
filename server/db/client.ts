import { Pool, PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import { config } from "../config.ts"
import { InternalServerError } from "../utils/errors.ts"

// Create a connection pool
const connectionPool = new Pool(
  config.db.connectionString,
  config.db.poolSize,
  true
)

/**
 * Get a database connection from the pool
 */
export async function getConnection(): Promise<PoolClient> {
  try {
    return await connectionPool.connect()
  } catch (error) {
    console.error("Failed to get database connection:", error)
    throw new InternalServerError("Database connection failed")
  }
}

/**
 * Execute a database query
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const connection = await getConnection()
  try {
    const result = await connection.queryObject<T>(text, params)
    return result.rows
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Execute a database query and return a single row
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Execute a database transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const connection = await getConnection()
  try {
    await connection.queryObject("BEGIN")
    const result = await callback(connection)
    await connection.queryObject("COMMIT")
    return result
  } catch (error) {
    await connection.queryObject("ROLLBACK")
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Initialize database connection and verify it's working
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test the connection
    const connection = await getConnection()
    const result = await connection.queryObject<{ time: Date }>(
      "SELECT NOW() as time"
    )
    connection.release()

    console.log(`Database connection established at ${result.rows[0].time}`)
  } catch (error) {
    console.error("Failed to initialize database:", error)
    throw error
  }
}
