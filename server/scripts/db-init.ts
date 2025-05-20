#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Database Initialization Script
 * 
 * This script initializes the PostgreSQL database for the Lotto Picker application.
 * It reads the init.sql file and executes it against the database.
 * 
 * Usage:
 *   deno run --allow-net --allow-env --allow-read scripts/db-init.ts [--environment=development|staging|production]
 */

import { parse } from "https://deno.land/std@0.160.0/flags/mod.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { config } from "../config.ts";

// Parse command line arguments
const args = parse(Deno.args, {
  string: ["environment"],
  default: { environment: "development" },
});

// Validate environment
const validEnvironments = ["development", "staging", "production"];
if (!validEnvironments.includes(args.environment)) {
  console.error(`Error: Invalid environment "${args.environment}". Must be one of: ${validEnvironments.join(", ")}`);
  Deno.exit(1);
}

// Get connection string from environment or config
const connectionString = Deno.env.get("NEON_CONNECTION_STRING") || config.db.connectionString;

if (!connectionString) {
  console.error("Error: No database connection string provided.");
  console.error("Please set the NEON_CONNECTION_STRING environment variable or update your config.");
  Deno.exit(1);
}

// Read the SQL initialization file
async function readSqlFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    console.error(`Error reading SQL file: ${error.message}`);
    Deno.exit(1);
  }
}

// Initialize the database
async function initializeDatabase() {
  console.log(`Initializing database for ${args.environment} environment...`);
  
  // Create a connection pool
  const pool = new Pool(connectionString, config.db.poolSize, true);
  
  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Set the application environment
      await client.queryObject(`SET app.environment = '${args.environment}'`);
      
      // Read the initialization SQL
      const sqlContent = await readSqlFile("./db/init.sql");
      
      // Execute the SQL
      console.log("Executing initialization SQL...");
      await client.queryObject(sqlContent);
      
      console.log("Database initialization completed successfully!");
      
      // Verify the database was initialized correctly
      const tablesResult = await client.queryObject<{ table_name: string }>(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = 'lotto_picker' 
         ORDER BY table_name`
      );
      
      console.log("\nInitialized tables:");
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      
      // Check if sample data was created (only in development)
      if (args.environment === "development") {
        const groupsCount = await client.queryObject<{ count: number }>(
          "SELECT COUNT(*) as count FROM lotto_picker.groups"
        );
        
        console.log(`\nSample data: ${groupsCount.rows[0].count > 0 ? "Created" : "Not created"}`);
      }
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    Deno.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase();
