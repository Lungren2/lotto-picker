// Configuration settings for the server

/**
 * Load environment variables
 *
 * When using Doppler, these environment variables will be injected by the Doppler CLI
 * when running the application with `doppler run -- deno run ...`
 */
const ENV = Deno.env.get("DENO_ENV") || "development"
const NEON_CONNECTION_STRING = Deno.env.get("NEON_CONNECTION_STRING") || ""
const PORT = parseInt(Deno.env.get("PORT") || "8000")

// CORS origins based on environment
const corsOrigins =
  ENV === "production"
    ? Deno.env.get("CORS_ORIGINS")?.split(",") || ["https://oddly.netlify.app"]
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://oddly.netlify.app",
      ]

// Validate required environment variables
if (!NEON_CONNECTION_STRING) {
  console.error("Missing NEON_CONNECTION_STRING environment variable")
  if (ENV === "production") {
    Deno.exit(1)
  }
}

// Log configuration source for debugging
console.log(`Loading configuration from environment variables (${ENV} mode)`)

export const config = {
  env: ENV,
  port: PORT,
  db: {
    connectionString: NEON_CONNECTION_STRING,
    poolSize: parseInt(Deno.env.get("DB_POOL_SIZE") || "10"),
    connectionTimeout: parseInt(
      Deno.env.get("DB_CONNECTION_TIMEOUT") || "30000"
    ), // 30 seconds
  },
  corsOrigins,
  security: {
    invitationCodeLength: parseInt(
      Deno.env.get("INVITATION_CODE_LENGTH") || "10"
    ),
    defaultInvitationExpiryHours: parseInt(
      Deno.env.get("DEFAULT_INVITATION_EXPIRY_HOURS") || "24"
    ),
  },
  socketIO: {
    pingInterval: parseInt(Deno.env.get("SOCKET_PING_INTERVAL") || "10000"),
    pingTimeout: parseInt(Deno.env.get("SOCKET_PING_TIMEOUT") || "5000"),
  },
}
