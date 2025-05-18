import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FadingScrollArea } from "./FadingScrollArea"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function ScrollAreaTest() {
  const [verticalItems, setVerticalItems] = useState(
    Array.from({ length: 20 }, (_, i) => i + 1)
  )

  const [horizontalItems, setHorizontalItems] = useState(
    Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + (i % 26)))
  )

  const addVerticalItems = () => {
    setVerticalItems((prev) => [
      ...prev,
      ...Array.from({ length: 10 }, (_, i) => prev.length + i + 1),
    ])
  }

  const addHorizontalItems = () => {
    setHorizontalItems((prev) => [
      ...prev,
      ...Array.from({ length: 10 }, (_, i) =>
        String.fromCharCode(65 + ((prev.length + i) % 26))
      ),
    ])
  }

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Scroll Area Test</CardTitle>
        <CardDescription>
          Test the fading scroll area with both vertical and horizontal
          scrolling
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Tabs defaultValue='vertical'>
          <TabsList className='w-full mb-4'>
            <TabsTrigger value='vertical' className='flex-1'>
              Vertical Scrolling
            </TabsTrigger>
            <TabsTrigger value='horizontal' className='flex-1'>
              Horizontal Scrolling
            </TabsTrigger>
            <TabsTrigger value='both' className='flex-1'>
              Both Directions
            </TabsTrigger>
          </TabsList>

          <TabsContent value='vertical'>
            <FadingScrollArea className='h-[300px] border rounded-md p-4'>
              <div className='space-y-4'>
                {verticalItems.map((item) => (
                  <div
                    key={item}
                    className={`p-4 border rounded-md ${
                      item === 1
                        ? "bg-blue-100 dark:bg-blue-900"
                        : item === verticalItems.length
                        ? "bg-green-100 dark:bg-green-900"
                        : ""
                    }`}
                  >
                    {item === 1
                      ? "⬆️ First Item"
                      : item === verticalItems.length
                      ? "⬇️ Last Item"
                      : `Item ${item}`}
                  </div>
                ))}
              </div>
            </FadingScrollArea>

            <Button onClick={addVerticalItems} className='w-full mt-4'>
              Add More Vertical Items
            </Button>
          </TabsContent>

          <TabsContent value='horizontal'>
            <FadingScrollArea className='h-[300px] border rounded-md p-4'>
              <div className='flex space-x-4 min-w-[1500px]'>
                {horizontalItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-md flex-shrink-0 w-[100px] h-[100px] flex items-center justify-center text-2xl font-bold ${
                      index === 0
                        ? "bg-blue-100 dark:bg-blue-900"
                        : index === horizontalItems.length - 1
                        ? "bg-green-100 dark:bg-green-900"
                        : ""
                    }`}
                  >
                    {index === 0
                      ? "⬅️"
                      : index === horizontalItems.length - 1
                      ? "➡️"
                      : item}
                  </div>
                ))}
              </div>
            </FadingScrollArea>

            <Button onClick={addHorizontalItems} className='w-full mt-4'>
              Add More Horizontal Items
            </Button>
          </TabsContent>

          <TabsContent value='both'>
            <FadingScrollArea className='h-[300px] border rounded-md p-4'>
              <div className='space-y-4 min-w-[1500px]'>
                {verticalItems.map((item) => (
                  <div
                    key={item}
                    className={`p-4 border rounded-md flex space-x-4 ${
                      item === 1
                        ? "bg-blue-50 dark:bg-blue-950"
                        : item === verticalItems.length
                        ? "bg-green-50 dark:bg-green-950"
                        : ""
                    }`}
                  >
                    {horizontalItems.slice(0, 15).map((letter, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        className={`p-4 border rounded-md flex-shrink-0 w-[80px] h-[80px] flex items-center justify-center ${
                          idx === 0
                            ? "bg-blue-100 dark:bg-blue-900"
                            : idx === 14
                            ? "bg-green-100 dark:bg-green-900"
                            : ""
                        }`}
                      >
                        {idx === 0 && item === 1
                          ? "↖️"
                          : idx === 14 && item === 1
                          ? "↗️"
                          : idx === 0 && item === verticalItems.length
                          ? "↙️"
                          : idx === 14 && item === verticalItems.length
                          ? "↘️"
                          : `${letter}${item}`}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </FadingScrollArea>

            <div className='flex gap-2 mt-4'>
              <Button onClick={addVerticalItems} className='flex-1'>
                Add Vertical Items
              </Button>
              <Button onClick={addHorizontalItems} className='flex-1'>
                Add Horizontal Items
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
