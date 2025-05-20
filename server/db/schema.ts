import { z } from "zod"

// Base schemas for database entities

/**
 * Group schema
 */
export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Group = z.infer<typeof groupSchema>

/**
 * Group invitation schema
 */
export const groupInvitationSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  invitation_code: z.string().min(6).max(20),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date(),
})

export type GroupInvitation = z.infer<typeof groupInvitationSchema>

/**
 * User schema
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().min(1).max(100),
  display_name: z.string().min(1).max(100).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type User = z.infer<typeof userSchema>

/**
 * Group member schema
 */
export const groupMemberSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  joined_at: z.coerce.date(),
})

export type GroupMember = z.infer<typeof groupMemberSchema>

/**
 * Number set schema
 */
export const numberSetSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  numbers: z.array(z.number().int().positive()),
  quantity: z.number().int().positive(),
  max_value: z.number().int().positive(),
  created_at: z.coerce.date(),
})

export type NumberSet = z.infer<typeof numberSetSchema>

// Request/Response schemas for API endpoints

/**
 * Create group request schema
 */
export const createGroupRequestSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

export type CreateGroupRequest = z.infer<typeof createGroupRequestSchema>

/**
 * Create invitation request schema
 */
export const createInvitationRequestSchema = z.object({
  groupId: z.string().uuid(),
  expiresInHours: z.number().int().positive().default(24),
})

export type CreateInvitationRequest = z.infer<
  typeof createInvitationRequestSchema
>

/**
 * Join group request schema
 */
export const joinGroupRequestSchema = z.object({
  invitationCode: z.string().min(6).max(20),
  clientId: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100).optional(),
})

export type JoinGroupRequest = z.infer<typeof joinGroupRequestSchema>

/**
 * Validate number set request schema
 */
export const validateNumberSetRequestSchema = z.object({
  groupId: z.string().uuid(),
  numbers: z.array(z.number().int().positive()),
  quantity: z.number().int().positive(),
  maxValue: z.number().int().positive(),
})

export type ValidateNumberSetRequest = z.infer<
  typeof validateNumberSetRequestSchema
>

/**
 * Save number set request schema
 */
export const saveNumberSetRequestSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  numbers: z.array(z.number().int().positive()),
  quantity: z.number().int().positive(),
  maxValue: z.number().int().positive(),
})

export type SaveNumberSetRequest = z.infer<typeof saveNumberSetRequestSchema>
