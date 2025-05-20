import { toast } from "@/components/ui/sonner";

// API base URL - use environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = `${API_URL}${endpoint}`;
    
    // Set default headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
    
    // Parse response
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle error responses
    if (!response.ok) {
      const errorMessage = 
        typeof data === "object" && data.error?.message
          ? data.error.message
          : "An error occurred";
      
      toast.error("API Error", { description: errorMessage });
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    // Re-throw the error for the caller to handle
    throw error;
  }
}

// API functions for groups
export const groupsApi = {
  create: (name: string) => 
    apiRequest<{ success: boolean; data: any }>("/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
    
  getById: (id: string) => 
    apiRequest<{ success: boolean; data: any }>(`/groups/${id}`),
    
  getMembers: (id: string) => 
    apiRequest<{ success: boolean; data: any }>(`/groups/${id}/members`),
    
  getNumberSets: (id: string) => 
    apiRequest<{ success: boolean; data: any }>(`/groups/${id}/number-sets`),
};

// API functions for invitations
export const invitationsApi = {
  create: (groupId: string, expiresInHours = 24) => 
    apiRequest<{ success: boolean; data: any }>("/invitations", {
      method: "POST",
      body: JSON.stringify({ groupId, expiresInHours }),
    }),
    
  getByCode: (code: string) => 
    apiRequest<{ success: boolean; data: any }>(`/invitations/${code}`),
    
  join: (code: string, clientId: string, displayName?: string) => 
    apiRequest<{ success: boolean; data: any }>(`/invitations/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ clientId, displayName }),
    }),
};

// API functions for number sets
export const numberSetsApi = {
  validate: (groupId: string, numbers: number[], quantity: number, maxValue: number) => 
    apiRequest<{ success: boolean; data: any }>("/number-sets/validate", {
      method: "POST",
      body: JSON.stringify({ groupId, numbers, quantity, maxValue }),
    }),
    
  save: (groupId: string, userId: string, numbers: number[], quantity: number, maxValue: number) => 
    apiRequest<{ success: boolean; data: any }>("/number-sets", {
      method: "POST",
      body: JSON.stringify({ groupId, userId, numbers, quantity, maxValue }),
    }),
    
  getUserSets: (userId: string) => 
    apiRequest<{ success: boolean; data: any }>(`/users/${userId}/number-sets`),
};
