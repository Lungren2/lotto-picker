import { query, queryOne } from "../db/client.ts";
import { NumberSet } from "../db/schema.ts";
import { ConflictError, NotFoundError } from "../utils/errors.ts";
import { getGroupById } from "./groupService.ts";

/**
 * Validate if a number set is unique within a group
 */
export async function validateNumberSet(
  groupId: string, 
  numbers: number[], 
  quantity: number, 
  maxValue: number
): Promise<{
  isUnique: boolean;
  existingSet: NumberSet | null;
}> {
  // Check if group exists
  await getGroupById(groupId);
  
  // Sort numbers for consistent comparison
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  
  // Check if this exact set already exists in the group
  const existingSet = await queryOne<NumberSet>(
    "SELECT * FROM number_sets WHERE group_id = $1 AND numbers = $2",
    [groupId, sortedNumbers]
  );
  
  return {
    isUnique: !existingSet,
    existingSet
  };
}

/**
 * Save a new number set for a group
 */
export async function saveNumberSet(
  groupId: string, 
  userId: string, 
  numbers: number[], 
  quantity: number, 
  maxValue: number
): Promise<NumberSet> {
  // Sort numbers for consistent storage
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  
  // First validate that this set doesn't already exist
  const validation = await validateNumberSet(groupId, sortedNumbers, quantity, maxValue);
  
  if (!validation.isUnique) {
    throw new ConflictError(
      "This number set already exists in the group",
      {
        existingSet: validation.existingSet
      }
    );
  }
  
  try {
    const result = await queryOne<NumberSet>(
      "INSERT INTO number_sets (group_id, user_id, numbers, quantity, max_value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [groupId, userId, sortedNumbers, quantity, maxValue]
    );
    
    if (!result) {
      throw new Error("Failed to save number set");
    }
    
    return result;
  } catch (error) {
    // Check for unique constraint violation
    if (error.message?.includes("unique constraint") || error.message?.includes("duplicate key")) {
      throw new ConflictError("This number set already exists in the group");
    }
    
    console.error("Error saving number set:", error);
    throw error;
  }
}

/**
 * Get all number sets for a group
 */
export async function getGroupNumberSets(groupId: string): Promise<Array<NumberSet & { user_display_name: string | null }>> {
  // Check if group exists
  await getGroupById(groupId);
  
  const numberSets = await query<NumberSet & { user_display_name: string | null }>(
    `SELECT ns.*, u.display_name as user_display_name
     FROM number_sets ns
     JOIN users u ON ns.user_id = u.id
     WHERE ns.group_id = $1
     ORDER BY ns.created_at DESC`,
    [groupId]
  );
  
  return numberSets;
}

/**
 * Get all number sets for a user
 */
export async function getUserNumberSets(userId: string): Promise<Array<NumberSet & { group_name: string }>> {
  const numberSets = await query<NumberSet & { group_name: string }>(
    `SELECT ns.*, g.name as group_name
     FROM number_sets ns
     JOIN groups g ON ns.group_id = g.id
     WHERE ns.user_id = $1
     ORDER BY ns.created_at DESC`,
    [userId]
  );
  
  return numberSets;
}
