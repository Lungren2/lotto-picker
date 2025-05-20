import { Context, Next } from "@oak/oak";
import { AppError } from "./utils/errors.ts";

/**
 * Global error handling middleware
 */
export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error("Error caught in middleware:", err);
    
    if (err instanceof AppError) {
      // Handle known application errors
      ctx.response.status = err.status;
      ctx.response.body = {
        success: false,
        error: {
          message: err.message,
          code: err.code,
          details: err.details
        }
      };
    } else if (err instanceof Error) {
      // Handle generic errors
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: {
          message: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
          details: ctx.app.env === "development" ? err.message : undefined
        }
      };
    } else {
      // Handle unknown errors
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: {
          message: "Unknown error occurred",
          code: "UNKNOWN_ERROR"
        }
      };
    }
  }
}

/**
 * Request logging middleware
 */
export async function requestLogger(ctx: Context, next: Next) {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  // Add request ID to response headers for debugging
  ctx.response.headers.set("X-Request-ID", requestId);
  
  // Log request details
  console.log(`[${requestId}] ${ctx.request.method} ${ctx.request.url.pathname} - Started`);
  
  try {
    await next();
    
    // Log response details
    const ms = Date.now() - start;
    console.log(`[${requestId}] ${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`);
  } catch (error) {
    // Log error but let error handler middleware handle it
    const ms = Date.now() - start;
    console.error(`[${requestId}] ${ctx.request.method} ${ctx.request.url.pathname} - Error - ${ms}ms`);
    throw error;
  }
}
