import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { useNumberStore } from "@/stores/numberStore"
import { useGroupStore } from "@/stores/groupStore"
import { toast } from "sonner"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { HistoryDialog } from "./HistoryDialog"
import { GroupDialog } from "./GroupDialog"
import { JoinGroupDialog } from "./JoinGroupDialog"
import { CustomFloatingDock } from "./CustomFloatingDock"

// Import icons
import { History, Sun, Moon, Users, UserPlus, Zap } from "lucide-react"

export function FloatingDockWrapper() {
  // Get state and actions from stores
  const { generateNumbers } = useNumberStore()
  const { currentGroup } = useGroupStore()
  const { theme, setTheme } = useTheme()

  // State for dialogs
  const [historyOpen, setHistoryOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [joinGroupOpen, setJoinGroupOpen] = useState(false)

  // Listen for events to open the join group dialog
  useEffect(() => {
    const handleOpenJoinGroupDialog = () => {
      setJoinGroupOpen(true)
    }

    window.addEventListener("openJoinGroupDialog", handleOpenJoinGroupDialog)

    return () => {
      window.removeEventListener(
        "openJoinGroupDialog",
        handleOpenJoinGroupDialog
      )
    }
  }, [])

  // Error handling
  const { handleError } = useErrorHandler({
    component: "FloatingDockWrapper",
    showToast: true,
  })

  // Handle quick generate
  const handleQuickGenerate = () => {
    try {
      generateNumbers()
      toast.success("Numbers generated", {
        description: "New random numbers have been generated.",
      })
    } catch (error) {
      handleError(error, "generating numbers")
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // Group integration functionality
  const { currentSet, quantity, maxValue } = useNumberStore()
  const { validateNumberSet, saveNumberSet } = useGroupStore()

  // When a new set is generated, validate and save it to the group if in a group
  useEffect(() => {
    // Skip if not in a group or no numbers generated
    if (!currentGroup || !currentSet || currentSet.length === 0) {
      return
    }

    // Skip if the quantity doesn't match (happens during initialization)
    if (currentSet.length !== quantity) {
      return
    }

    const validateAndSaveNumbers = async () => {
      try {
        // First validate if the set is unique in the group
        const isUnique = await validateNumberSet(currentSet, quantity, maxValue)

        if (!isUnique) {
          toast.error("Duplicate number set", {
            description:
              "This exact number set already exists in your group. Generating a new set...",
          })

          // Generate a new set
          setTimeout(() => {
            generateNumbers()
          }, 1500)

          return
        }

        // Save the number set to the group
        await saveNumberSet(currentSet, quantity, maxValue)
      } catch (error) {
        handleError(error, "validating/saving number set")
      }
    }

    validateAndSaveNumbers()
  }, [
    currentSet,
    currentGroup,
    quantity,
    maxValue,
    validateNumberSet,
    saveNumberSet,
    handleError,
    generateNumbers,
  ])

  // Define dock items
  const dockItems = [
    {
      title: "History",
      icon: <History className='h-5 w-5 text-primary' />,
      onClick: () => setHistoryOpen(true),
    },
    {
      title: "Theme",
      icon:
        theme === "dark" ? (
          <Sun className='h-5 w-5 text-yellow-300' />
        ) : (
          <Moon className='h-5 w-5 text-slate-700' />
        ),
      onClick: toggleTheme,
    },
    {
      title: "Join Group",
      icon: <UserPlus className='h-5 w-5 text-primary' />,
      onClick: () => setJoinGroupOpen(true),
    },
    {
      title: "Group",
      icon: <Users className='h-5 w-5 text-primary' />,
      onClick: () => setGroupOpen(true),
      badge: currentGroup ? true : false,
    },
    {
      title: "Quick Generate",
      icon: <Zap className='h-5 w-5 text-primary' />,
      onClick: handleQuickGenerate,
    },
  ]

  return (
    <>
      <CustomFloatingDock
        items={dockItems}
        desktopClassName='fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
        mobileClassName='fixed bottom-4 right-4 z-50'
      />

      {/* Dialogs */}
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <JoinGroupDialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen} />
      <GroupDialog open={groupOpen} onOpenChange={setGroupOpen} />
    </>
  )
}
