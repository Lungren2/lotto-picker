import { useEffect } from "react";
import { useNumberStore } from "@/stores/numberStore";
import { useGroupStore } from "@/stores/groupStore";
import { toast } from "@/components/ui/sonner";
import { GroupStatus } from "./GroupStatus";
import { GroupNumberSets } from "./GroupNumberSets";

/**
 * This component integrates the group feature with the number generation
 * It validates number sets against the group and saves them to the group
 */
export function GroupIntegration() {
  const { currentSet, quantity, maxValue } = useNumberStore();
  const { 
    currentGroup, 
    validateNumberSet, 
    saveNumberSet 
  } = useGroupStore();
  
  // When a new set is generated, validate and save it to the group if in a group
  useEffect(() => {
    // Skip if not in a group or no numbers generated
    if (!currentGroup || !currentSet || currentSet.length === 0) {
      return;
    }
    
    // Skip if the quantity doesn't match (happens during initialization)
    if (currentSet.length !== quantity) {
      return;
    }
    
    const validateAndSaveNumbers = async () => {
      try {
        // First validate if the set is unique in the group
        const isUnique = await validateNumberSet(currentSet, quantity, maxValue);
        
        if (!isUnique) {
          toast.error("Duplicate number set", {
            description: "This exact number set already exists in your group. Generating a new set...",
          });
          
          // Generate a new set
          setTimeout(() => {
            useNumberStore.getState().generateNumbers();
          }, 1500);
          
          return;
        }
        
        // Save the number set to the group
        await saveNumberSet(currentSet, quantity, maxValue);
      } catch (error) {
        console.error("Error validating/saving number set:", error);
        toast.error("Error saving to group", {
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    };
    
    validateAndSaveNumbers();
  }, [currentSet, currentGroup, quantity, maxValue]);
  
  return (
    <div className="space-y-4 w-full">
      <GroupStatus />
      <GroupNumberSets />
    </div>
  );
}
