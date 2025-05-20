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
import { Input } from "@/components/ui/input"
import { useGroupStore } from "@/stores/groupStore"
import { toast } from "sonner"
import { useErrorHandler } from "@/hooks/useErrorHandler"

interface JoinGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinGroupDialog({ open, onOpenChange }: JoinGroupDialogProps) {
  const { joinGroupWithCode, createGroup } = useGroupStore()
  const [groupCode, setGroupCode] = useState("")
  const [groupName, setGroupName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Initialize error handler
  const { handleError } = useErrorHandler({
    component: "JoinGroupDialog",
    showToast: true,
  })

  // Handle joining a group
  const handleJoinGroup = async () => {
    if (!groupCode) {
      toast.error("Please enter a group code")
      return
    }

    try {
      await joinGroupWithCode(groupCode)
      setGroupCode("")
      onOpenChange(false)
      toast.success("Joined group successfully")
    } catch (error) {
      handleError(error, "joining group")
    }
  }

  // Handle creating a group
  const handleCreateGroup = async () => {
    if (!groupName) {
      toast.error("Please enter a group name")
      return
    }

    try {
      await createGroup(groupName)
      setGroupName("")
      onOpenChange(false)
      toast.success("Group created successfully")
    } catch (error) {
      handleError(error, "creating group")
    }
  }

  // Toggle between join and create modes
  const toggleMode = () => {
    setIsCreating(!isCreating)
    setGroupCode("")
    setGroupName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New Group" : "Join Existing Group"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? "Create a new group and invite others to join."
              : "Enter a group code to join an existing group."}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          {isCreating ? (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='groupName' className='text-sm font-medium'>
                  Group Name
                </label>
                <Input
                  id='groupName'
                  placeholder='Enter a name for your group...'
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <Button className='w-full' onClick={handleCreateGroup}>
                Create Group
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='groupCode' className='text-sm font-medium'>
                  Group Code
                </label>
                <Input
                  id='groupCode'
                  placeholder='Enter group code...'
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                />
              </div>

              <Button className='w-full' onClick={handleJoinGroup}>
                Join Group
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className='flex flex-col sm:flex-row gap-2'>
          <Button
            variant='outline'
            onClick={toggleMode}
            className='w-full sm:w-auto'
          >
            {isCreating ? "Join Existing Group" : "Create New Group"}
          </Button>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
