// Simple script to test Doppler integration

console.log("Testing Doppler environment variables:");
console.log("-------------------------------------");
console.log(`DENO_ENV: ${Deno.env.get("DENO_ENV") || "Not set"}`);
console.log(`PORT: ${Deno.env.get("PORT") || "Not set"}`);
console.log(`NEON_CONNECTION_STRING: ${Deno.env.get("NEON_CONNECTION_STRING") ? "Set (value hidden)" : "Not set"}`);
console.log(`DOPPLER_PROJECT: ${Deno.env.get("DOPPLER_PROJECT") || "Not set"}`);
console.log(`DOPPLER_CONFIG: ${Deno.env.get("DOPPLER_CONFIG") || "Not set"}`);
console.log("-------------------------------------");
