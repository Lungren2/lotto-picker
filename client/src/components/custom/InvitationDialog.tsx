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
import { Copy, Check } from "lucide-react";

interface InvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationDialog({ open, onOpenChange }: InvitationDialogProps) {
  const [invitationCode, setInvitationCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const prefersReducedMotion = useReducedMotion();
  const { currentGroup, createInvitation } = useGroupStore();
  
  const handleCreateInvitation = async () => {
    if (!currentGroup) {
      toast.error("No active group", {
        description: "You need to be in a group to create an invitation."
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create invitation
      const code = await createInvitation(currentGroup.id);
      setInvitationCode(code);
    } catch (error) {
      console.error("Failed to create invitation:", error);
      toast.error("Failed to create invitation", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleCopyCode = () => {
    if (!invitationCode) return;
    
    navigator.clipboard.writeText(invitationCode)
      .then(() => {
        setIsCopied(true);
        toast.success("Copied to clipboard", {
          description: "Invitation code copied to clipboard."
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy", {
          description: "Could not copy to clipboard. Please try again."
        });
      });
  };
  
  // Animation variants
  const contentVariants = {
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
          <DialogTitle>Group Invitation</DialogTitle>
          <DialogDescription>
            Create and share an invitation code for others to join your group.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="grid gap-4 py-4"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          {invitationCode ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this code with others to join your group:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    value={invitationCode}
                    readOnly
                    className="text-center font-mono text-lg"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyCode}
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>This code will expire in 24 hours.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Create an invitation code to share with others.
              </p>
              <Button 
                onClick={handleCreateInvitation} 
                disabled={isCreating}
                className="mx-auto"
              >
                {isCreating ? "Creating..." : "Create Invitation Code"}
              </Button>
            </div>
          )}
        </motion.div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
