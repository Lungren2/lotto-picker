import { query } from "./client.ts"

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...")

  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get applied migrations
    const appliedMigrations = await query<{ name: string }>(
      "SELECT name FROM migrations ORDER BY id"
    )
    const appliedMigrationNames = new Set(appliedMigrations.map((m) => m.name))

    // Run migrations in order
    for (const migration of migrations) {
      if (!appliedMigrationNames.has(migration.name)) {
        console.log(`Applying migration: ${migration.name}`)
        await query(migration.up)
        await query("INSERT INTO migrations (name) VALUES ($1)", [
          migration.name,
        ])
        console.log(`Migration applied: ${migration.name}`)
      } else {
        console.log(`Migration already applied: ${migration.name}`)
      }
    }

    console.log("Database migrations completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}

/**
 * Migration definitions
 */
const migrations = [
  {
    name: "001_initial_schema",
    up: `
      -- Groups table
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Group invitations table
      CREATE TABLE IF NOT EXISTS group_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        invitation_code VARCHAR(20) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_invitation_code UNIQUE (invitation_code)
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Group members table
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
      );

      -- Number sets table
      CREATE TABLE IF NOT EXISTS number_sets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        numbers INTEGER[] NOT NULL,
        quantity INTEGER NOT NULL,
        max_value INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_number_sets_group_id ON number_sets(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_invitations_code ON group_invitations(invitation_code);

      -- Create a unique constraint on group_id and numbers to prevent duplicates
      -- PostgreSQL can compare arrays directly
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_number_set_per_group
      ON number_sets(group_id, numbers);
    `,
  },
]
