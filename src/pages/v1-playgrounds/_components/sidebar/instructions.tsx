import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Trophy, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function Instructions() {
  return (
    <div className="w-full h-full border-r border-[#333333] bg-[#252526] flex flex-col">
      <Tabs defaultValue="instructions">
        <ScrollArea className="border-b border-[#333333]">
          <TabsList className="h-auto gap-2 rounded-none bg-transparent px-4 py-2">
            <TabsTrigger
              value="instructions"
              className={cn(
                "relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-[2px] after:h-[2px]",
                "hover:bg-[#2a2d2e] hover:text-[#cccccc]",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-[#007acc]",
                "data-[state=active]:hover:bg-[#2a2d2e]"
              )}
            >
              <BookOpen
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Instructions
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className={cn(
                "relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-[2px] after:h-[2px]",
                "hover:bg-[#2a2d2e] hover:text-[#cccccc]",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-[#007acc]",
                "data-[state=active]:hover:bg-[#2a2d2e]"
              )}
            >
              <Trophy
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Challenges
              <Badge className="ms-1.5 min-w-5 bg-[#333333] px-1 text-[#cccccc]">
                0/4
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="discussions"
              className={cn(
                "relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-[2px] after:h-[2px]",
                "hover:bg-[#2a2d2e] hover:text-[#cccccc]",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-[#007acc]",
                "data-[state=active]:hover:bg-[#2a2d2e]"
              )}
            >
              <MessageSquare
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Discussions
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="bg-[#333333]" />
        </ScrollArea>

        <TabsContent value="instructions" className="flex-1 p-4 m-0">
          <div className="prose prose-invert max-w-none">
            <h1>Welcome to the Playground</h1>
            <p>This is where you'll find instructions for the current task.</p>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="flex-1 p-4 m-0">
          <div className="prose prose-invert max-w-none">
            <h2>Challenges</h2>
            <p>Complete these challenges to progress:</p>
            <ul>
              <li>Challenge 1</li>
              <li>Challenge 2</li>
              <li>Challenge 3</li>
              <li>Challenge 4</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="flex-1 p-4 m-0">
          <div className="prose prose-invert max-w-none">
            <h2>Discussions</h2>
            <p>Join the conversation about this playground.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 