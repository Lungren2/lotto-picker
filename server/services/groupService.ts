import { query, queryOne, transaction } from "../db/client.ts"
import { generateRandomCode } from "../utils/validation.ts"
import { config } from "../config.ts"
import { Group, GroupInvitation, User, GroupMember } from "../db/schema.ts"
import {
  NotFoundError,
  ConflictError as _ConflictError,
  BadRequestError as _BadRequestError,
} from "../utils/errors.ts"

/**
 * Create a new group
 */
export async function createGroup(name: string): Promise<Group> {
  try {
    const result = await queryOne<Group>(
      "INSERT INTO groups (name) VALUES ($1) RETURNING *",
      [name]
    )

    if (!result) {
      throw new Error("Failed to create group")
    }

    return result
  } catch (error) {
    console.error("Error creating group:", error)
    throw error
  }
}

/**
 * Get a group by ID
 */
export async function getGroupById(id: string): Promise<Group> {
  const group = await queryOne<Group>("SELECT * FROM groups WHERE id = $1", [
    id,
  ])

  if (!group) {
    throw new NotFoundError(`Group with ID ${id} not found`)
  }

  return group
}

/**
 * Create a group invitation
 */
export async function createInvitation(
  groupId: string,
  expiresInHours = config.security.defaultInvitationExpiryHours
): Promise<GroupInvitation> {
  // Check if group exists
  await getGroupById(groupId)

  // Generate a unique invitation code
  const invitationCode = generateRandomCode(
    config.security.invitationCodeLength
  )

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiresInHours)

  try {
    const result = await queryOne<GroupInvitation>(
      "INSERT INTO group_invitations (group_id, invitation_code, expires_at) VALUES ($1, $2, $3) RETURNING *",
      [groupId, invitationCode, expiresAt.toISOString()]
    )

    if (!result) {
      throw new Error("Failed to create invitation")
    }

    return result
  } catch (error) {
    console.error("Error creating invitation:", error)
    throw error
  }
}

/**
 * Get an invitation by code
 */
export async function getInvitationByCode(
  code: string
): Promise<GroupInvitation> {
  const invitation = await queryOne<GroupInvitation>(
    "SELECT * FROM group_invitations WHERE invitation_code = $1 AND expires_at > NOW()",
    [code]
  )

  if (!invitation) {
    throw new NotFoundError("Invalid or expired invitation code")
  }

  return invitation
}

/**
 * Join a group using an invitation code
 */
export async function joinGroup(
  invitationCode: string,
  clientId: string,
  displayName?: string
): Promise<{
  group: Group
  user: User
  alreadyMember: boolean
}> {
  return await transaction(async (client) => {
    // Get the invitation
    const invitationResult = await client.queryObject<GroupInvitation>(
      "SELECT * FROM group_invitations WHERE invitation_code = $1 AND expires_at > NOW()",
      [invitationCode]
    )

    if (invitationResult.rows.length === 0) {
      throw new NotFoundError("Invalid or expired invitation code")
    }

    const invitation = invitationResult.rows[0]

    // Get or create user
    const userResult = await client.queryObject<User>(
      "SELECT * FROM users WHERE client_id = $1",
      [clientId]
    )

    let user: User
    if (userResult.rows.length === 0) {
      // Create new user
      const userInsertResult = await client.queryObject<User>(
        "INSERT INTO users (client_id, display_name) VALUES ($1, $2) RETURNING *",
        [clientId, displayName || `User-${clientId.substring(0, 6)}`]
      )

      if (userInsertResult.rows.length === 0) {
        throw new Error("Failed to create user")
      }

      user = userInsertResult.rows[0]
    } else {
      user = userResult.rows[0]
    }

    // Check if user is already a member of the group
    const memberResult = await client.queryObject<GroupMember>(
      "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
      [invitation.group_id, user.id]
    )

    if (memberResult.rows.length > 0) {
      // User is already a member
      const groupResult = await client.queryObject<Group>(
        "SELECT * FROM groups WHERE id = $1",
        [invitation.group_id]
      )

      return {
        group: groupResult.rows[0],
        user,
        alreadyMember: true,
      }
    }

    // Add user to group
    await client.queryObject(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [invitation.group_id, user.id]
    )

    // Get the group
    const groupResult = await client.queryObject<Group>(
      "SELECT * FROM groups WHERE id = $1",
      [invitation.group_id]
    )

    return {
      group: groupResult.rows[0],
      user,
      alreadyMember: false,
    }
  })
}

/**
 * Get all members of a group
 */
export async function getGroupMembers(
  groupId: string
): Promise<
  Array<GroupMember & { client_id: string; display_name: string | null }>
> {
  // Check if group exists
  await getGroupById(groupId)

  const members = await query<
    GroupMember & { client_id: string; display_name: string | null }
  >(
    `SELECT gm.*, u.client_id, u.display_name
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     WHERE gm.group_id = $1`,
    [groupId]
  )

  return members
}
