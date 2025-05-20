import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { groupsApi, invitationsApi, numberSetsApi } from "@/api/client";
import { connectAndAuthenticate, joinGroup, subscribeToNewNumberSets, notifyNewNumberSet } from "@/api/socket";
import { toast } from "@/components/ui/sonner";

interface Group {
  id: string;
  name: string;
  createdAt: string;
}

interface GroupMember {
  userId: string;
  clientId: string;
  displayName: string | null;
  joinedAt: string;
}

interface NumberSet {
  id: string;
  userId: string;
  userDisplayName: string | null;
  numbers: number[];
  quantity: number;
  maxValue: number;
  createdAt: string;
}

interface GroupState {
  // Current user
  currentUser: {
    id: string;
    clientId: string;
    displayName: string;
  } | null;
  
  // Current group
  currentGroup: Group | null;
  groupMembers: GroupMember[];
  groupNumberSets: NumberSet[];
  
  // Loading states
  isLoading: boolean;
  isConnecting: boolean;
  
  // Actions
  setCurrentUser: (id: string, clientId: string, displayName: string) => void;
  createGroup: (name: string) => Promise<Group>;
  createInvitation: (groupId: string) => Promise<string>;
  joinGroupWithCode: (code: string) => Promise<void>;
  loadGroupData: (groupId: string) => Promise<void>;
  validateNumberSet: (numbers: number[], quantity: number, maxValue: number) => Promise<boolean>;
  saveNumberSet: (numbers: number[], quantity: number, maxValue: number) => Promise<void>;
  disconnect: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentUser: null,
      currentGroup: null,
      groupMembers: [],
      groupNumberSets: [],
      isLoading: false,
      isConnecting: false,
      
      // Set current user
      setCurrentUser: (id, clientId, displayName) => {
        set((state) => {
          state.currentUser = { id, clientId, displayName };
        });
      },
      
      // Create a new group
      createGroup: async (name) => {
        set((state) => { state.isLoading = true; });
        
        try {
          const response = await groupsApi.create(name);
          const group = response.data;
          
          set((state) => {
            state.currentGroup = {
              id: group.id,
              name: group.name,
              createdAt: group.created_at
            };
            state.isLoading = false;
          });
          
          toast.success("Group created", {
            description: `Group "${name}" has been created successfully.`
          });
          
          return group;
        } catch (error) {
          set((state) => { state.isLoading = false; });
          throw error;
        }
      },
      
      // Create an invitation for the current group
      createInvitation: async (groupId) => {
        set((state) => { state.isLoading = true; });
        
        try {
          const response = await invitationsApi.create(groupId);
          const invitation = response.data;
          
          set((state) => { state.isLoading = false; });
          
          toast.success("Invitation created", {
            description: "Share this code with others to join your group."
          });
          
          return invitation.invitation_code;
        } catch (error) {
          set((state) => { state.isLoading = false; });
          throw error;
        }
      },
      
      // Join a group with an invitation code
      joinGroupWithCode: async (code) => {
        const { currentUser } = get();
        
        if (!currentUser) {
          throw new Error("User not set");
        }
        
        set((state) => { 
          state.isLoading = true;
          state.isConnecting = true;
        });
        
        try {
          // Join the group via API
          const response = await invitationsApi.join(
            code, 
            currentUser.clientId, 
            currentUser.displayName
          );
          
          const { group, user, alreadyMember } = response.data;
          
          // Connect to Socket.IO and authenticate
          await connectAndAuthenticate(
            currentUser.clientId,
            user.id,
            currentUser.displayName
          );
          
          // Join the group's Socket.IO room
          await joinGroup(group.id);
          
          // Update state
          set((state) => {
            state.currentUser = {
              id: user.id,
              clientId: currentUser.clientId,
              displayName: currentUser.displayName
            };
            
            state.currentGroup = {
              id: group.id,
              name: group.name,
              createdAt: group.created_at
            };
            
            state.isLoading = false;
            state.isConnecting = false;
          });
          
          // Load group data
          await get().loadGroupData(group.id);
          
          toast.success(
            alreadyMember ? "Rejoined group" : "Joined group", 
            { description: `You have ${alreadyMember ? 'rejoined' : 'joined'} the group "${group.name}".` }
          );
        } catch (error) {
          set((state) => { 
            state.isLoading = false;
            state.isConnecting = false;
          });
          throw error;
        }
      },
      
      // Load group data (members and number sets)
      loadGroupData: async (groupId) => {
        set((state) => { state.isLoading = true; });
        
        try {
          // Load group members
          const membersResponse = await groupsApi.getMembers(groupId);
          
          // Load group number sets
          const numberSetsResponse = await groupsApi.getNumberSets(groupId);
          
          // Subscribe to new number sets
          const unsubscribe = subscribeToNewNumberSets((data) => {
            if (data.groupId === groupId) {
              set((state) => {
                state.groupNumberSets.unshift({
                  id: data.numberSet.id,
                  userId: data.numberSet.userId,
                  userDisplayName: data.numberSet.username || null,
                  numbers: data.numberSet.numbers,
                  quantity: data.numberSet.quantity,
                  maxValue: data.numberSet.maxValue,
                  createdAt: new Date().toISOString()
                });
              });
              
              toast.info("New number set", {
                description: "A group member has generated a new number set."
              });
            }
          });
          
          // Update state
          set((state) => {
            state.groupMembers = membersResponse.data.map((member: any) => ({
              userId: member.user_id,
              clientId: member.client_id,
              displayName: member.display_name,
              joinedAt: member.joined_at
            }));
            
            state.groupNumberSets = numberSetsResponse.data.map((set: any) => ({
              id: set.id,
              userId: set.user_id,
              userDisplayName: set.user_display_name,
              numbers: set.numbers,
              quantity: set.quantity,
              maxValue: set.max_value,
              createdAt: set.created_at
            }));
            
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => { state.isLoading = false; });
          throw error;
        }
      },
      
      // Validate if a number set is unique in the group
      validateNumberSet: async (numbers, quantity, maxValue) => {
        const { currentGroup, currentUser } = get();
        
        if (!currentGroup || !currentUser) {
          throw new Error("Group or user not set");
        }
        
        try {
          const response = await numberSetsApi.validate(
            currentGroup.id,
            numbers,
            quantity,
            maxValue
          );
          
          return response.data.isUnique;
        } catch (error) {
          throw error;
        }
      },
      
      // Save a number set to the group
      saveNumberSet: async (numbers, quantity, maxValue) => {
        const { currentGroup, currentUser } = get();
        
        if (!currentGroup || !currentUser) {
          throw new Error("Group or user not set");
        }
        
        set((state) => { state.isLoading = true; });
        
        try {
          // Save the number set
          const response = await numberSetsApi.save(
            currentGroup.id,
            currentUser.id,
            numbers,
            quantity,
            maxValue
          );
          
          const savedSet = response.data;
          
          // Update local state
          set((state) => {
            state.groupNumberSets.unshift({
              id: savedSet.id,
              userId: savedSet.user_id,
              userDisplayName: currentUser.displayName,
              numbers: savedSet.numbers,
              quantity: savedSet.quantity,
              maxValue: savedSet.max_value,
              createdAt: savedSet.created_at
            });
            
            state.isLoading = false;
          });
          
          // Notify other group members
          notifyNewNumberSet(currentGroup.id, {
            id: savedSet.id,
            numbers: savedSet.numbers,
            quantity: savedSet.quantity,
            maxValue: savedSet.max_value
          });
          
          toast.success("Number set saved", {
            description: "Your number set has been saved to the group."
          });
        } catch (error) {
          set((state) => { state.isLoading = false; });
          
          // Check if it's a conflict error (duplicate set)
          if (error instanceof Error && error.message.includes("already exists")) {
            toast.error("Duplicate number set", {
              description: "This exact number set already exists in your group."
            });
          }
          
          throw error;
        }
      },
      
      // Disconnect from the group
      disconnect: () => {
        set((state) => {
          state.currentGroup = null;
          state.groupMembers = [];
          state.groupNumberSets = [];
        });
      }
    })),
    {
      name: "oddly-group-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentGroup: state.currentGroup
      })
    }
  )
);
