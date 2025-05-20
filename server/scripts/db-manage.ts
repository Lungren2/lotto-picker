#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Database Management Script
 * 
 * This script provides utilities for managing the PostgreSQL database for the Lotto Picker application.
 * 
 * Usage:
 *   deno run --allow-net --allow-env --allow-read scripts/db-manage.ts [command] [options]
 * 
 * Commands:
 *   info      - Display information about the database
 *   tables    - List all tables in the database
 *   clear     - Clear all data from the database (keeps structure)
 *   drop      - Drop all tables from the database
 *   seed      - Seed the database with sample data
 *   backup    - Backup the database schema and data
 *   stats     - Show database statistics
 */

import { parse } from "https://deno.land/std@0.160.0/flags/mod.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { config } from "../config.ts";

// Parse command line arguments
const args = parse(Deno.args, {
  string: ["environment"],
  default: { environment: "development" },
  alias: { e: "environment", h: "help" },
});

// Display help
if (args.help || args._.length === 0) {
  console.log(`
Database Management Script

Usage:
  deno run --allow-net --allow-env --allow-read scripts/db-manage.ts [command] [options]

Commands:
  info      - Display information about the database
  tables    - List all tables in the database
  clear     - Clear all data from the database (keeps structure)
  drop      - Drop all tables from the database
  seed      - Seed the database with sample data
  backup    - Backup the database schema and data
  stats     - Show database statistics

Options:
  -e, --environment=<env>  - Environment (development, staging, production)
  -h, --help               - Show this help message
  `);
  Deno.exit(0);
}

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

// Create a connection pool
const pool = new Pool(connectionString, config.db.poolSize, true);

// Get the command
const command = args._[0]?.toString().toLowerCase();

// Execute the command
async function executeCommand() {
  try {
    switch (command) {
      case "info":
        await showDatabaseInfo();
        break;
      case "tables":
        await listTables();
        break;
      case "clear":
        await clearData();
        break;
      case "drop":
        await dropTables();
        break;
      case "seed":
        await seedData();
        break;
      case "backup":
        await backupDatabase();
        break;
      case "stats":
        await showDatabaseStats();
        break;
      default:
        console.error(`Error: Unknown command "${command}"`);
        Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error executing command "${command}":`, error);
    Deno.exit(1);
  } finally {
    await pool.end();
  }
}

// Show database information
async function showDatabaseInfo() {
  const client = await pool.connect();
  try {
    console.log("Database Information:");
    
    // Get PostgreSQL version
    const versionResult = await client.queryObject<{ version: string }>(
      "SELECT version()"
    );
    console.log(`\nPostgreSQL Version: ${versionResult.rows[0].version}`);
    
    // Get database name
    const dbNameResult = await client.queryObject<{ current_database: string }>(
      "SELECT current_database()"
    );
    console.log(`Database Name: ${dbNameResult.rows[0].current_database}`);
    
    // Get schema information
    const schemaResult = await client.queryObject<{ schema_name: string }>(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'lotto_picker'"
    );
    console.log(`Schema 'lotto_picker' exists: ${schemaResult.rows.length > 0 ? 'Yes' : 'No'}`);
    
    // Get table count
    const tableCountResult = await client.queryObject<{ count: string }>(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'lotto_picker'"
    );
    console.log(`Number of tables: ${tableCountResult.rows[0].count}`);
    
    // Get applied migrations
    const migrationsResult = await client.queryObject<{ name: string, applied_at: Date }>(
      "SELECT name, applied_at FROM lotto_picker.migrations ORDER BY id"
    ).catch(() => ({ rows: [] }));
    
    if (migrationsResult.rows.length > 0) {
      console.log("\nApplied Migrations:");
      migrationsResult.rows.forEach(row => {
        console.log(`- ${row.name} (${row.applied_at.toISOString()})`);
      });
    } else {
      console.log("\nNo migrations applied yet.");
    }
  } finally {
    client.release();
  }
}

// List all tables
async function listTables() {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ table_name: string, row_count: number }>(
      `SELECT 
        t.table_name, 
        (SELECT COUNT(*) FROM lotto_picker."${Deno.build.os === "windows" ? "$1" : "$1"}") AS row_count
       FROM information_schema.tables t
       WHERE t.table_schema = 'lotto_picker'
       ORDER BY t.table_name`,
      ["$1"]
    ).catch(() => {
      return client.queryObject<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'lotto_picker'
         ORDER BY table_name`
      );
    });
    
    console.log("Tables in lotto_picker schema:");
    result.rows.forEach(row => {
      if ('row_count' in row) {
        console.log(`- ${row.table_name} (${row.row_count} rows)`);
      } else {
        console.log(`- ${row.table_name}`);
      }
    });
  } finally {
    client.release();
  }
}

// Clear all data
async function clearData() {
  if (args.environment === "production") {
    console.error("Error: Cannot clear data in production environment.");
    Deno.exit(1);
  }
  
  const client = await pool.connect();
  try {
    console.log("Clearing all data from the database...");
    
    await client.queryObject("BEGIN");
    
    // Get all tables
    const tablesResult = await client.queryObject<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'lotto_picker'
       AND table_name != 'migrations'
       ORDER BY table_name`
    );
    
    // Disable triggers temporarily
    await client.queryObject("SET session_replication_role = 'replica'");
    
    // Truncate all tables
    for (const row of tablesResult.rows) {
      console.log(`Truncating table: ${row.table_name}`);
      await client.queryObject(`TRUNCATE TABLE lotto_picker."${row.table_name}" CASCADE`);
    }
    
    // Re-enable triggers
    await client.queryObject("SET session_replication_role = 'origin'");
    
    await client.queryObject("COMMIT");
    console.log("All data cleared successfully!");
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Drop all tables
async function dropTables() {
  if (args.environment === "production") {
    console.error("Error: Cannot drop tables in production environment.");
    Deno.exit(1);
  }
  
  const client = await pool.connect();
  try {
    console.log("Dropping all tables from the database...");
    
    await client.queryObject("BEGIN");
    
    // Drop the schema and recreate it (this will drop all tables)
    await client.queryObject("DROP SCHEMA IF EXISTS lotto_picker CASCADE");
    await client.queryObject("CREATE SCHEMA lotto_picker");
    
    await client.queryObject("COMMIT");
    console.log("All tables dropped successfully!");
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Seed the database with sample data
async function seedData() {
  if (args.environment === "production") {
    console.error("Error: Cannot seed data in production environment.");
    Deno.exit(1);
  }
  
  const client = await pool.connect();
  try {
    console.log("Seeding the database with sample data...");
    
    await client.queryObject("BEGIN");
    
    // Create a sample group
    const groupResult = await client.queryObject<{ id: string }>(
      "INSERT INTO lotto_picker.groups (name) VALUES ('Sample Lottery Group') RETURNING id"
    );
    const groupId = groupResult.rows[0].id;
    
    // Create sample users
    const userIds = [];
    for (let i = 1; i <= 3; i++) {
      const userResult = await client.queryObject<{ id: string }>(
        "INSERT INTO lotto_picker.users (client_id, display_name) VALUES ($1, $2) RETURNING id",
        [`sample-client-${i}`, `Sample User ${i}`]
      );
      userIds.push(userResult.rows[0].id);
    }
    
    // Add users to the group
    for (const userId of userIds) {
      await client.queryObject(
        "INSERT INTO lotto_picker.group_members (group_id, user_id) VALUES ($1, $2)",
        [groupId, userId]
      );
    }
    
    // Create sample invitations
    await client.queryObject(
      "INSERT INTO lotto_picker.group_invitations (group_id, invitation_code, expires_at) VALUES ($1, $2, $3)",
      [groupId, "SAMPLE123", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]
    );
    
    // Create sample number sets
    const numberSets = [
      [1, 7, 13, 24, 35, 42],
      [5, 11, 17, 23, 31, 47],
      [2, 8, 19, 27, 36, 44]
    ];
    
    for (let i = 0; i < userIds.length; i++) {
      await client.queryObject(
        "INSERT INTO lotto_picker.number_sets (group_id, user_id, numbers, quantity, max_value) VALUES ($1, $2, $3, $4, $5)",
        [groupId, userIds[i], numberSets[i], 6, 49]
      );
    }
    
    await client.queryObject("COMMIT");
    console.log("Sample data seeded successfully!");
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Backup the database
async function backupDatabase() {
  console.log("This feature is not implemented yet.");
  console.log("To backup your database, use the pg_dump tool:");
  console.log("pg_dump -h <host> -U <username> -d <database> -f backup.sql");
}

// Show database statistics
async function showDatabaseStats() {
  const client = await pool.connect();
  try {
    console.log("Database Statistics:");
    
    // Get table row counts
    const tableStatsResult = await client.queryObject<{ table_name: string, row_count: string }>(
      `SELECT 
        table_name,
        (SELECT COUNT(*) FROM lotto_picker."${Deno.build.os === "windows" ? "$1" : "$1"}") AS row_count
       FROM information_schema.tables
       WHERE table_schema = 'lotto_picker'
       ORDER BY table_name`,
      ["$1"]
    ).catch(() => {
      return client.queryObject<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'lotto_picker'
         ORDER BY table_name`
      );
    });
    
    console.log("\nTable Row Counts:");
    tableStatsResult.rows.forEach(row => {
      if ('row_count' in row) {
        console.log(`- ${row.table_name}: ${row.row_count} rows`);
      } else {
        console.log(`- ${row.table_name}: (count not available)`);
      }
    });
    
    // Get index information
    const indexStatsResult = await client.queryObject<{ table_name: string, index_name: string }>(
      `SELECT 
        t.relname AS table_name,
        i.relname AS index_name
       FROM pg_index x
       JOIN pg_class t ON t.oid = x.indrelid
       JOIN pg_class i ON i.oid = x.indexrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname = 'lotto_picker'
       ORDER BY t.relname, i.relname`
    );
    
    console.log("\nIndexes:");
    let currentTable = "";
    indexStatsResult.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        console.log(`\n${currentTable}:`);
      }
      console.log(`  - ${row.index_name}`);
    });
  } finally {
    client.release();
  }
}

// Run the command
executeCommand();
