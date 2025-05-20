import { Router, Context } from "@oak/oak";
import { createInvitation, getInvitationByCode, joinGroup } from "../services/groupService.ts";
import { validateData } from "../utils/validation.ts";
import { createInvitationRequestSchema, joinGroupRequestSchema } from "../db/schema.ts";
import { NotFoundError, BadRequestError } from "../utils/errors.ts";

const router = new Router();

/**
 * Create a new group invitation
 * POST /invitations
 */
router.post("/invitations", async (ctx: Context) => {
  try {
    // Parse and validate request body
    const body = await ctx.request.body.json();
    const validatedData = validateData(createInvitationRequestSchema, body);
    
    // Create invitation
    const invitation = await createInvitation(
      validatedData.groupId,
      validatedData.expiresInHours
    );
    
    // Return success response
    ctx.response.status = 201;
    ctx.response.body = { 
      success: true, 
      data: invitation 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

/**
 * Get an invitation by code
 * GET /invitations/:code
 */
router.get("/invitations/:code", async (ctx: Context) => {
  try {
    const code = ctx.params.code;
    
    if (!code) {
      throw new BadRequestError("Invitation code is required");
    }
    
    // Get invitation
    const invitation = await getInvitationByCode(code);
    
    // Return success response
    ctx.response.body = { 
      success: true, 
      data: invitation 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

/**
 * Join a group using an invitation code
 * POST /invitations/:code/join
 */
router.post("/invitations/:code/join", async (ctx: Context) => {
  try {
    const code = ctx.params.code;
    
    if (!code) {
      throw new BadRequestError("Invitation code is required");
    }
    
    // Parse and validate request body
    const body = await ctx.request.body.json();
    const validatedData = validateData(joinGroupRequestSchema, {
      ...body,
      invitationCode: code
    });
    
    // Join group
    const result = await joinGroup(
      validatedData.invitationCode,
      validatedData.clientId,
      validatedData.displayName
    );
    
    // Return success response
    ctx.response.status = 200;
    ctx.response.body = { 
      success: true, 
      data: result 
    };
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error;
  }
});

export default router;
