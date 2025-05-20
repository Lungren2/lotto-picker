import { useState } from "react"
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { useGroupStore } from "@/stores/groupStore"
import ScrollFade from "./FadingScrollArea"
import { toast } from "sonner"
import { useErrorHandler } from "@/hooks/useErrorHandler"

// Event bus for cross-component communication
export const openJoinGroupDialog = () => {
  const event = new CustomEvent("openJoinGroupDialog")
  window.dispatchEvent(event)
}

interface GroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupDialog({ open, onOpenChange }: GroupDialogProps) {
  const { currentGroup, groupNumberSets, groupMembers, disconnect } =
    useGroupStore()
  const [activeTab, setActiveTab] = useState(currentGroup ? "members" : "join")

  // Initialize error handler
  const { handleError } = useErrorHandler({
    component: "GroupDialog",
    showToast: true,
  })

  // Handle leaving a group
  const handleLeaveGroup = async () => {
    try {
      disconnect()
      onOpenChange(false)
      toast.success("Left group successfully")
    } catch (error) {
      handleError(error, "leaving group")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[700px] max-h-[85vh]'>
        <DialogHeader>
          <DialogTitle>Group Management</DialogTitle>
          <DialogDescription>
            {currentGroup
              ? `You're in group: ${currentGroup.name}`
              : "You are not currently in a group. Use the Join Group button to join one."}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          {!currentGroup ? (
            <div className='flex flex-col items-center justify-center h-[45vh] space-y-4'>
              <p className='text-muted-foreground text-center'>
                You need to join a group first.
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  // Open the join group dialog after a short delay
                  setTimeout(() => {
                    openJoinGroupDialog()
                  }, 100)
                }}
              >
                Join or Create a Group
              </Button>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='w-full mb-4'>
                <TabsTrigger value='members'>Members</TabsTrigger>
                <TabsTrigger value='sets'>Number Sets</TabsTrigger>
              </TabsList>

              <TabsContent value='members' className='space-y-4'>
                <ScrollFade className='h-[45vh] rounded-md'>
                  <div className='space-y-2'>
                    {groupMembers && groupMembers.length > 0 ? (
                      groupMembers.map((member) => (
                        <Card key={member.userId} className='p-4'>
                          <div className='flex justify-between items-center'>
                            <div>
                              <p className='font-medium'>
                                {member.displayName}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                {/* Assuming the first member is the owner for now */}
                                {member === groupMembers[0]
                                  ? "Owner"
                                  : "Member"}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className='flex items-center justify-center h-full text-muted-foreground'>
                        No members in this group yet.
                      </div>
                    )}
                  </div>
                </ScrollFade>
              </TabsContent>

              <TabsContent value='sets' className='space-y-4'>
                <ScrollFade className='h-[45vh] rounded-md'>
                  <div className='space-y-2'>
                    {groupNumberSets && groupNumberSets.length > 0 ? (
                      groupNumberSets.map((set) => (
                        <Card key={set.id} className='p-4'>
                          <div>
                            <p className='text-sm text-muted-foreground mb-2'>
                              {set.userDisplayName} •{" "}
                              {new Date(set.createdAt).toLocaleString()}
                            </p>
                            <div className='flex flex-wrap gap-2'>
                              {set.numbers.map((num) => (
                                <div
                                  key={`${set.id}-${num}`}
                                  className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium'
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className='flex items-center justify-center h-full text-muted-foreground'>
                        No number sets in this group yet.
                      </div>
                    )}
                  </div>
                </ScrollFade>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className='flex justify-between'>
          {currentGroup && (
            <Button
              variant='destructive'
              onClick={handleLeaveGroup}
              className='mr-auto'
            >
              Leave Group
            </Button>
          )}
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
