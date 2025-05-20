import { Router, Context } from "@oak/oak";
import { createGroup, getGroupById, getGroupMembers } from "../services/groupService.ts";
import { getGroupNumberSets } from "../services/numberService.ts";
import { validateData } from "../utils/validation.ts";
import { createGroupRequestSchema } from "../db/schema.ts";
import { NotFoundError } from "../utils/errors.ts";

const router = new Router();

/**
 * Create a new group
 * POST /groups
 */
router.post("/groups", async (ctx: Context) => {
  try {
    // Parse and validate request body
    const body = await ctx.request.body.json();
    const validatedData = validateData(createGroupRequestSchema, body);
    
    // Create group
    const group = await createGroup(validatedData.name);
    
    // Return success response
    ctx.response.status = 201;
    ctx.response.body = { 
      success: true, 
      data: group 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

/**
 * Get a group by ID
 * GET /groups/:id
 */
router.get("/groups/:id", async (ctx: Context) => {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      throw new NotFoundError("Group ID is required");
    }
    
    // Get group
    const group = await getGroupById(id);
    
    // Return success response
    ctx.response.body = { 
      success: true, 
      data: group 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

/**
 * Get all members of a group
 * GET /groups/:id/members
 */
router.get("/groups/:id/members", async (ctx: Context) => {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      throw new NotFoundError("Group ID is required");
    }
    
    // Get group members
    const members = await getGroupMembers(id);
    
    // Return success response
    ctx.response.body = { 
      success: true, 
      data: members 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

/**
 * Get all number sets for a group
 * GET /groups/:id/number-sets
 */
router.get("/groups/:id/number-sets", async (ctx: Context) => {
  try {
    const id = ctx.params.id;
    
    if (!id) {
      throw new NotFoundError("Group ID is required");
    }
    
    // Get group number sets
    const numberSets = await getGroupNumberSets(id);
    
    // Return success response
    ctx.response.body = { 
      success: true, 
      data: numberSets 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

export default router;
