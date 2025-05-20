#!/usr/bin/env -S deno run --allow-run --allow-env

/**
 * Doppler Diagnostics Script
 *
 * This script helps diagnose issues with Doppler integration.
 * It checks the Doppler CLI installation, configuration, and connectivity.
 *
 * Usage:
 *   deno run --allow-run --allow-env doppler-diagnostics.ts
 */

// Helper function to run a command and return its output
async function runCommand(
  cmd: string[],
  ignoreErrors = false
): Promise<string> {
  try {
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: "piped",
      stderr: "piped",
    })

    const { success, stdout, stderr } = await command.output()

    if (!success && !ignoreErrors) {
      throw new Error(`Command failed: ${new TextDecoder().decode(stderr)}`)
    }

    return new TextDecoder().decode(stdout)
  } catch (error: unknown) {
    if (ignoreErrors) {
      if (error instanceof Error) {
        return `Error: ${error.message}`
      }
      return `Error: ${String(error)}`
    }
    throw error
  }
}

// Check if Doppler CLI is installed
async function checkDopplerInstallation(): Promise<boolean> {
  try {
    const version = await runCommand(["doppler", "--version"])
    console.log(`✅ Doppler CLI is installed: ${version.trim()}`)
    return true
  } catch (_error) {
    console.error("❌ Doppler CLI is not installed or not in PATH")
    console.error("   Install Doppler CLI: https://docs.doppler.com/docs/cli")
    return false
  }
}

// Check Doppler configuration
async function checkDopplerConfiguration(): Promise<void> {
  try {
    const config = await runCommand(["doppler", "configure"])
    console.log("✅ Doppler configuration:")
    console.log(config)
  } catch (error: unknown) {
    console.error(
      "❌ Failed to get Doppler configuration:",
      error instanceof Error ? error.message : String(error)
    )
  }
}

// Check Doppler connectivity
async function checkDopplerConnectivity(): Promise<void> {
  try {
    // Try to list projects as a connectivity test
    await runCommand(["doppler", "projects"])
    console.log("✅ Successfully connected to Doppler API")
  } catch (error: unknown) {
    console.error(
      "❌ Failed to connect to Doppler API:",
      error instanceof Error ? error.message : String(error)
    )
    console.error("   Check your internet connection and authentication")
  }
}

// Check Doppler secrets access
async function checkSecretsAccess(): Promise<void> {
  try {
    // Just check if we can access secrets, don't show them
    await runCommand(["doppler", "secrets"])
    console.log("✅ Successfully accessed Doppler secrets")
  } catch (error: unknown) {
    console.error(
      "❌ Failed to access Doppler secrets:",
      error instanceof Error ? error.message : String(error)
    )
    console.error("   Check your authentication and project/config settings")
  }
}

// Check Doppler setup file
async function checkDopplerSetupFile(): Promise<void> {
  try {
    const fileExists = await runCommand(["test", "-f", "doppler.yaml"], true)
    if (fileExists.includes("Error")) {
      console.error("❌ doppler.yaml file not found")
      console.error(
        "   Create a doppler.yaml file with your project and config"
      )
    } else {
      console.log("✅ doppler.yaml file exists")
      // Try to read the file content
      const content = await runCommand(["cat", "doppler.yaml"], true)
      if (!content.includes("Error")) {
        console.log("   Content:")
        console.log(content)
      }
    }
  } catch (error: unknown) {
    console.error(
      "❌ Failed to check doppler.yaml file:",
      error instanceof Error ? error.message : String(error)
    )
  }
}

// Main function
async function main() {
  console.log("🔍 Running Doppler diagnostics...\n")

  const isInstalled = await checkDopplerInstallation()
  if (!isInstalled) {
    return
  }

  console.log("\n📋 Checking Doppler configuration...")
  await checkDopplerConfiguration()

  console.log("\n🌐 Checking Doppler connectivity...")
  await checkDopplerConnectivity()

  console.log("\n🔑 Checking Doppler secrets access...")
  await checkSecretsAccess()

  console.log("\n📄 Checking Doppler setup file...")
  await checkDopplerSetupFile()

  console.log("\n✨ Diagnostics completed!")
}

// Run the script
if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    )
    Deno.exit(1)
  })
}
