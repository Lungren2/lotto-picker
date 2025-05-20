import { Router, Context } from "@oak/oak"
import {
  validateNumberSet,
  saveNumberSet,
  getUserNumberSets,
} from "../services/numberService.ts"
import { validateData } from "../utils/validation.ts"
import {
  validateNumberSetRequestSchema,
  saveNumberSetRequestSchema,
} from "../db/schema.ts"
import { BadRequestError } from "../utils/errors.ts"

const router = new Router()

/**
 * Validate if a number set is unique within a group
 * POST /number-sets/validate
 */
router.post("/number-sets/validate", async (ctx: Context) => {
  try {
    // Parse and validate request body
    const body = await ctx.request.body.json()
    const validatedData = validateData(validateNumberSetRequestSchema, body)

    // Validate number set
    const validation = await validateNumberSet(
      validatedData.groupId,
      validatedData.numbers,
      validatedData.quantity,
      validatedData.maxValue
    )

    // Return success response
    ctx.response.body = {
      success: true,
      data: validation,
    }
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error
  }
})

/**
 * Save a new number set
 * POST /number-sets
 */
router.post("/number-sets", async (ctx: Context) => {
  try {
    // Parse and validate request body
    const body = await ctx.request.body.json()
    const validatedData = validateData(saveNumberSetRequestSchema, body)

    // Validate input
    if (validatedData.numbers.length !== validatedData.quantity) {
      throw new BadRequestError(
        `Number of elements in 'numbers' array must match 'quantity'. Expected: ${validatedData.quantity}, Actual: ${validatedData.numbers.length}`
      )
    }

    // Check for duplicates in the numbers array
    const uniqueNumbers = new Set(validatedData.numbers)
    if (uniqueNumbers.size !== validatedData.numbers.length) {
      throw new BadRequestError(
        `Numbers array contains duplicate values: ${validatedData.numbers.join(
          ", "
        )}`
      )
    }

    // Check if all numbers are within range
    const outOfRangeNumbers = validatedData.numbers.filter(
      (n) => n < 1 || n > validatedData.maxValue
    )

    if (outOfRangeNumbers.length > 0) {
      throw new BadRequestError(
        `Numbers must be between 1 and ${
          validatedData.maxValue
        }. Out of range: ${outOfRangeNumbers.join(", ")}`
      )
    }

    // Save number set
    const numberSet = await saveNumberSet(
      validatedData.groupId,
      validatedData.userId,
      validatedData.numbers,
      validatedData.quantity,
      validatedData.maxValue
    )

    // Return success response
    ctx.response.status = 201
    ctx.response.body = {
      success: true,
      data: numberSet,
    }
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error
  }
})

/**
 * Get all number sets for a user
 * GET /users/:userId/number-sets
 */
router.get<{ userId: string }>("/users/:userId/number-sets", async (ctx) => {
  try {
    const { userId } = ctx.params

    if (!userId) {
      throw new BadRequestError("User ID is required")
    }

    // Get user number sets
    const numberSets = await getUserNumberSets(userId)

    // Return success response
    ctx.response.body = {
      success: true,
      data: numberSets,
    }
  } catch (error) {
    // Error handling is done by the global error middleware
    throw error
  }
})

export default router
