import { useState } from "react";
import { useGroupStore } from "@/stores/groupStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface GroupCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
}

export function GroupCreateDialog({ 
  open, 
  onOpenChange,
  onCreated
}: GroupCreateDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const prefersReducedMotion = useReducedMotion();
  const { createGroup, setCurrentUser, loadGroupData } = useGroupStore();
  
  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Group name required", {
        description: "Please enter a name for your group."
      });
      return;
    }
    
    if (!displayName.trim()) {
      toast.error("Display name required", {
        description: "Please enter a display name to identify yourself in the group."
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Generate a client ID if not already set
      const clientId = localStorage.getItem("oddly-client-id") || 
        `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Save client ID for future use
      localStorage.setItem("oddly-client-id", clientId);
      
      // Set current user in the store
      setCurrentUser(
        "", // Will be set by the server
        clientId,
        displayName
      );
      
      // Create the group
      const group = await createGroup(groupName);
      
      // Load group data
      await loadGroupData(group.id);
      
      // Close the dialog
      onOpenChange(false);
      
      // Call the onCreated callback if provided
      if (onCreated) {
        onCreated(group.id);
      }
      
      // Show invitation dialog
      setTimeout(() => {
        toast.success("Create an invitation", {
          description: "Create an invitation code to invite others to your group.",
          action: {
            label: "Create",
            onClick: () => {
              // Show invitation creation dialog
              // This will be handled by the parent component
            }
          }
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Group</DialogTitle>
          <DialogDescription>
            Create a new lottery group to share with friends and avoid duplicate numbers.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="grid gap-4 py-4"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group-name" className="text-right">
              Group Name
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="display-name" className="text-right">
              Your Name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="col-span-3"
            />
          </div>
        </motion.div>
        
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
