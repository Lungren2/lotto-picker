import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { Share2, Copy, Check } from "lucide-react"
import { useSonnerToast } from "@/hooks/useSonnerToast"

interface ShareButtonProps {
  numbers: number[]
  quantity: number
  maxValue: number
  className?: string
}

export function ShareButton({
  numbers,
  quantity,
  maxValue,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useSonnerToast()

  // Check if Web Share API is supported
  const isShareSupported = typeof navigator !== "undefined" && !!navigator.share

  // Format numbers for sharing
  const formatNumbers = () => {
    return numbers.join(", ")
  }

  // Create share text
  const createShareText = () => {
    return `My lottery numbers: ${formatNumbers()}\nGenerated ${quantity} numbers from 1-${maxValue} using Oddly - Random Number Generator\nhttps://oddly.netlify.app/`
  }

  // Handle share action
  const handleShare = async () => {
    const shareText = createShareText()

    if (isShareSupported) {
      try {
        await navigator.share({
          title: "My Lottery Numbers",
          text: shareText,
          url: "https://oddly.netlify.app/",
        })

        toast({
          title: "Shared successfully!",
          description: "Your numbers have been shared.",
        })
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error)
          toast({
            title: "Sharing failed",
            description: "Could not share your numbers.",
            variant: "destructive",
          })
        }
      }
    } else {
      // Fallback to clipboard
      handleCopy()
    }
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    const shareText = createShareText()

    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)

      toast({
        title: "Copied to clipboard!",
        description: "Your numbers have been copied to the clipboard.",
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "Could not copy your numbers to clipboard.",
        variant: "destructive",
      })
    }
  }

  // If numbers are empty, don't render the button
  if (!numbers.length) return null

  return (
    <div className={className}>
      {isShareSupported ? (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleShare}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <Share2 className='h-4 w-4' />
            Share
          </Button>
        </motion.div>
      ) : (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCopy}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            {copied ? (
              <>
                <Check className='h-4 w-4 text-green-500' />
                Copied
              </>
            ) : (
              <>
                <Copy className='h-4 w-4' />
                Copy
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
