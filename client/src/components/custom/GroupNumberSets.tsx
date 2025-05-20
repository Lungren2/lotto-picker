import { useState } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { NumberBubble } from "./NumberBubble";
import { format } from "date-fns";

export function GroupNumberSets() {
  const prefersReducedMotion = useReducedMotion();
  const { currentGroup, groupNumberSets, currentUser } = useGroupStore();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        staggerChildren: prefersReducedMotion ? 0.05 : 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
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
  
  // If not in a group, don't show anything
  if (!currentGroup || !groupNumberSets.length) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Group Number Sets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-4 pb-4">
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {groupNumberSets.map((set) => (
                <motion.div
                  key={set.id}
                  className="border rounded-md p-3"
                  variants={itemVariants}
                  layout
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {set.quantity}/{set.maxValue}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(set.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    
                    {set.userId === currentUser?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                    
                    {set.userId !== currentUser?.id && set.userDisplayName && (
                      <Badge variant="outline" className="text-xs">
                        {set.userDisplayName}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {set.numbers.map((number, index) => (
                      <NumberBubble
                        key={`${set.id}-${number}`}
                        number={number}
                        size="sm"
                        variant="default"
                        index={index}
                        interactive={false}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
