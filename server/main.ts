import { Application, Router, Context } from "@oak/oak"
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"
import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts"
import { config } from "./config.ts"
import { errorHandler, requestLogger } from "./middleware.ts"
import groupsRouter from "./routes/groups.ts"
import invitationsRouter from "./routes/invitations.ts"
import numberSetsRouter from "./routes/numberSets.ts"
import { setupSocketHandlers } from "./socketHandlers.ts"
import { initializeDatabase } from "./db/client.ts"
import { runMigrations } from "./db/migrations.ts"

// Load environment variables
const PORT = config.port
const ENV = config.env

// Initialize the database and run migrations
async function startServer() {
  try {
    console.log("Initializing database connection...")
    await initializeDatabase()

    console.log("Running database migrations...")
    await runMigrations()

    // Create Oak application
    const app = new Application()
    const router = new Router()

    // Set up CORS
    app.use(
      oakCors({
        origin: config.corsOrigins,
        credentials: true,
      })
    )

    // Middleware
    app.use(requestLogger)
    app.use(errorHandler)

    // Health check route
    router.get("/health", (ctx: Context) => {
      ctx.response.body = {
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: ENV,
      }
    })

    // API info route
    router.get("/", (ctx: Context) => {
      ctx.response.body = {
        name: "Oddly API Server",
        version: "1.0.0",
        description:
          "API server for the Oddly lottery application group feature",
      }
    })

    // Mount routers
    app.use(groupsRouter.routes())
    app.use(groupsRouter.allowedMethods())
    app.use(invitationsRouter.routes())
    app.use(invitationsRouter.allowedMethods())
    app.use(numberSetsRouter.routes())
    app.use(numberSetsRouter.allowedMethods())
    app.use(router.routes())
    app.use(router.allowedMethods())

    // Set up Socket.IO server
    const io = new Server({
      cors: {
        origin: config.corsOrigins,
        credentials: true,
      },
    })

    // Set up Socket.IO handlers
    setupSocketHandlers(io)

    // Start the server
    console.log(`Starting server in ${ENV} mode on port ${PORT}...`)

    // Create a handler that combines Oak and Socket.IO
    const handler = io.handler(async (req) => {
      return (await app.handle(req)) || new Response(null, { status: 404 })
    })

    // Start the server using Deno.serve
    const server = Deno.serve({ port: PORT, handler })
    console.log(`Server running on http://localhost:${PORT}`)

    // Handle shutdown gracefully
    Deno.addSignalListener("SIGINT", () => {
      console.log("Shutting down server...")
      server.shutdown()
      Deno.exit(0)
    })

    Deno.addSignalListener("SIGTERM", () => {
      console.log("Shutting down server...")
      server.shutdown()
      Deno.exit(0)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    Deno.exit(1)
  }
}

// Start the server
startServer()
