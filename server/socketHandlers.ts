import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts"
import { getGroupMembers } from "./services/groupService.ts"

// Define event payload types for better type safety
interface AuthPayload {
  clientId: string
  userId: string
  username?: string
}

interface JoinGroupPayload {
  groupId: string
}

interface NumberSetGeneratedPayload {
  groupId: string
  numberSet: {
    id: string
    numbers: number[]
    quantity: number
    maxValue: number
  }
}

// Interface for connected user data
interface ConnectedUser {
  clientId: string
  userId: string
  username?: string
}

/**
 * Set up Socket.IO event handlers
 */
export function setupSocketHandlers(io: Server): void {
  // Track connected users
  const connectedUsers = new Map<string, ConnectedUser>()

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // Handle user authentication
    socket.on("authenticate", (data: AuthPayload) => {
      try {
        const { clientId, userId, username } = data

        if (!clientId || !userId) {
          socket.emit("error", {
            message: "Authentication failed: Missing clientId or userId",
            code: "AUTH_FAILED",
          })
          return
        }

        // Store user information
        connectedUsers.set(socket.id, { clientId, userId, username })

        // Join user's personal room
        socket.join(`user:${userId}`)

        socket.emit("authenticated", { success: true })
        console.log(`User authenticated: ${userId} (${clientId})`)
      } catch (error) {
        console.error("Authentication error:", error)
        socket.emit("error", {
          message: "Authentication failed: Server error",
          code: "AUTH_ERROR",
        })
      }
    })

    // Handle joining a group
    socket.on("joinGroup", async (data: JoinGroupPayload) => {
      try {
        const { groupId } = data
        const user = connectedUsers.get(socket.id)

        if (!user) {
          socket.emit("error", {
            message: "Not authenticated",
            code: "NOT_AUTHENTICATED",
          })
          return
        }

        // Join the group room
        socket.join(`group:${groupId}`)

        // Notify other group members
        socket.to(`group:${groupId}`).emit("memberJoined", {
          groupId,
          userId: user.userId,
          clientId: user.clientId,
          username: user.username,
        })

        // Get current group members
        try {
          const members = await getGroupMembers(groupId)

          socket.emit("groupJoined", {
            groupId,
            members: members.map((m) => ({
              userId: m.user_id,
              clientId: m.client_id,
              username: m.display_name,
              joinedAt: m.joined_at,
            })),
          })

          console.log(`User ${user.userId} joined group ${groupId}`)
        } catch (error) {
          console.error(`Error getting group members for ${groupId}:`, error)
          socket.emit("error", {
            message: "Failed to get group members",
            code: "GROUP_MEMBERS_ERROR",
          })
        }
      } catch (error) {
        console.error("Join group error:", error)
        socket.emit("error", {
          message: "Failed to join group",
          code: "JOIN_GROUP_ERROR",
        })
      }
    })

    // Handle number set generation
    socket.on("numberSetGenerated", (data: NumberSetGeneratedPayload) => {
      try {
        const { groupId, numberSet } = data
        const user = connectedUsers.get(socket.id)

        if (!user) {
          socket.emit("error", {
            message: "Not authenticated",
            code: "NOT_AUTHENTICATED",
          })
          return
        }

        // Broadcast to all group members except sender
        socket.to(`group:${groupId}`).emit("newNumberSet", {
          groupId,
          numberSet: {
            ...numberSet,
            userId: user.userId,
            clientId: user.clientId,
            username: user.username,
          },
        })

        console.log(
          `User ${user.userId} generated number set in group ${groupId}`
        )
      } catch (error) {
        console.error("Number set broadcast error:", error)
      }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id)

      if (user) {
        // Clean up user data
        connectedUsers.delete(socket.id)
        console.log(`User disconnected: ${user.userId} (${user.clientId})`)
      } else {
        console.log(`Socket disconnected: ${socket.id}`)
      }
    })
  })
}
