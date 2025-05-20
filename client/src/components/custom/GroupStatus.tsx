import { useState } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Users, UserPlus, LogOut, Link } from "lucide-react";
import { GroupJoinDialog } from "./GroupJoinDialog";
import { GroupCreateDialog } from "./GroupCreateDialog";
import { InvitationDialog } from "./InvitationDialog";

export function GroupStatus() {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  
  const prefersReducedMotion = useReducedMotion();
  const { currentGroup, currentUser, groupMembers, disconnect } = useGroupStore();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -10 },
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
  
  // If not in a group, show join/create options
  if (!currentGroup) {
    return (
      <>
        <motion.div
          className="flex items-center justify-center gap-2 p-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJoinDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Group
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </motion.div>
        
        <GroupJoinDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
        />
        
        <GroupCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }
  
  // If in a group, show group info and actions
  return (
    <>
      <motion.div
        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{groupMembers.length}</span>
          </Badge>
          <span className="text-sm font-medium truncate max-w-[150px]">
            {currentGroup.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowInvitationDialog(true)}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Invite others</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={disconnect}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Leave group</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>
      
      <InvitationDialog
        open={showInvitationDialog}
        onOpenChange={setShowInvitationDialog}
      />
    </>
  );
}
