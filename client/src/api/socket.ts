import { io, Socket } from "socket.io-client";
import { toast } from "@/components/ui/sonner";

// Socket.IO server URL - use environment variable
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

// Socket.IO client instance
let socket: Socket | null = null;

// Socket event types
export interface AuthPayload {
  clientId: string;
  userId: string;
  username?: string;
}

export interface GroupJoinedPayload {
  groupId: string;
  members: Array<{
    userId: string;
    clientId: string;
    username: string | null;
    joinedAt: string;
  }>;
}

export interface NewNumberSetPayload {
  groupId: string;
  numberSet: {
    id: string;
    userId: string;
    clientId: string;
    username?: string;
    numbers: number[];
    quantity: number;
    maxValue: number;
  };
}

// Initialize Socket.IO connection
export function initializeSocket(): Socket {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  // Set up event listeners
  socket.on("connect", () => {
    console.log("Socket connected");
  });
  
  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
  
  socket.on("error", (error) => {
    console.error("Socket error:", error);
    toast.error("Connection Error", {
      description: error.message || "An error occurred with the real-time connection",
    });
  });
  
  return socket;
}

// Connect and authenticate
export function connectAndAuthenticate(clientId: string, userId: string, username?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = initializeSocket();
    
    // Set up one-time event listeners for authentication
    socket.once("authenticated", () => {
      resolve();
    });
    
    socket.once("error", (error) => {
      reject(new Error(error.message || "Authentication failed"));
    });
    
    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Authenticate
    socket.emit("authenticate", { clientId, userId, username });
  });
}

// Join a group
export function joinGroup(groupId: string): Promise<GroupJoinedPayload> {
  return new Promise((resolve, reject) => {
    const socket = initializeSocket();
    
    if (!socket.connected) {
      reject(new Error("Socket not connected"));
      return;
    }
    
    // Set up one-time event listeners for group joining
    socket.once("groupJoined", (data: GroupJoinedPayload) => {
      resolve(data);
    });
    
    socket.once("error", (error) => {
      reject(new Error(error.message || "Failed to join group"));
    });
    
    // Join group
    socket.emit("joinGroup", { groupId });
  });
}

// Subscribe to new number sets in a group
export function subscribeToNewNumberSets(
  callback: (data: NewNumberSetPayload) => void
): () => void {
  const socket = initializeSocket();
  
  socket.on("newNumberSet", callback);
  
  // Return unsubscribe function
  return () => {
    socket.off("newNumberSet", callback);
  };
}

// Notify about a new number set
export function notifyNewNumberSet(
  groupId: string,
  numberSet: {
    id: string;
    numbers: number[];
    quantity: number;
    maxValue: number;
  }
): void {
  const socket = initializeSocket();
  
  if (!socket.connected) {
    console.error("Socket not connected");
    return;
  }
  
  socket.emit("numberSetGenerated", { groupId, numberSet });
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
