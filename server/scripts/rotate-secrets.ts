#!/usr/bin/env -S deno run --allow-run --allow-env

/**
 * Secret Rotation Script
 * 
 * This script helps automate the rotation of secrets in Doppler.
 * It can be used to rotate database credentials, API keys, and other secrets.
 * 
 * Usage:
 *   deno run --allow-run --allow-env rotate-secrets.ts
 */

// Configuration
const PROJECT = "lotto-picker";
const CONFIGS = ["dev_api", "prd_api"];

// Helper function to run a command and return its output
async function runCommand(cmd: string[]): Promise<string> {
  const process = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });

  const [status, stdout, stderr] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();

  if (!status.success) {
    throw new Error(`Command failed: ${new TextDecoder().decode(stderr)}`);
  }

  return new TextDecoder().decode(stdout);
}

// Function to rotate a secret
async function rotateSecret(secretName: string, newValue: string, config: string): Promise<void> {
  console.log(`Rotating ${secretName} for config ${config}...`);
  
  try {
    await runCommand([
      "doppler", "secrets", "set", 
      secretName, newValue,
      "--project", PROJECT,
      "--config", config
    ]);
    console.log(`✅ Successfully rotated ${secretName} for ${config}`);
  } catch (error) {
    console.error(`❌ Failed to rotate ${secretName} for ${config}:`, error.message);
  }
}

// Function to generate a random string (for passwords, API keys, etc.)
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
}

// Main function
async function main() {
  console.log("🔄 Starting secret rotation...");
  
  // Example: Rotate database password
  const newDbPassword = generateRandomString(24);
  
  // This is just an example - in a real scenario, you would:
  // 1. Generate new credentials
  // 2. Update the database with the new credentials
  // 3. Update the secrets in Doppler
  
  for (const config of CONFIGS) {
    // Example: Update a connection string with the new password
    // In a real scenario, you would parse the existing connection string,
    // update just the password part, and then set the new connection string
    await rotateSecret(
      "EXAMPLE_API_KEY", 
      `key_${generateRandomString(32)}`,
      config
    );
  }
  
  console.log("🎉 Secret rotation completed!");
}

// Run the script
if (import.meta.main) {
  main().catch(error => {
    console.error("Error:", error);
    Deno.exit(1);
  });
}
