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

interface GroupJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupJoinDialog({ open, onOpenChange }: GroupJoinDialogProps) {
  const [invitationCode, setInvitationCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  const prefersReducedMotion = useReducedMotion();
  const { joinGroupWithCode } = useGroupStore();
  
  const handleJoin = async () => {
    if (!invitationCode.trim()) {
      toast.error("Invitation code required", {
        description: "Please enter an invitation code to join a group."
      });
      return;
    }
    
    if (!displayName.trim()) {
      toast.error("Display name required", {
        description: "Please enter a display name to identify yourself in the group."
      });
      return;
    }
    
    setIsJoining(true);
    
    try {
      // Generate a client ID if not already set
      const clientId = localStorage.getItem("oddly-client-id") || 
        `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Save client ID for future use
      localStorage.setItem("oddly-client-id", clientId);
      
      // Set current user in the store
      useGroupStore.getState().setCurrentUser(
        "", // Will be set by the server
        clientId,
        displayName
      );
      
      // Join the group
      await joinGroupWithCode(invitationCode);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to join group:", error);
      toast.error("Failed to join group", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsJoining(false);
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
          <DialogTitle>Join a Group</DialogTitle>
          <DialogDescription>
            Enter an invitation code to join a lottery group and avoid duplicate numbers.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="grid gap-4 py-4"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invitation-code" className="text-right">
              Code
            </Label>
            <Input
              id="invitation-code"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Enter invitation code"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="display-name" className="text-right">
              Name
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
          <Button onClick={handleJoin} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
