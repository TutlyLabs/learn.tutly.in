import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, X } from "lucide-react"

interface TerminalProps {
  isVisible?: boolean;
}

export function Terminal({ isVisible = true }: TerminalProps) {
  const [terminals, setTerminals] = useState([
    { id: "1", name: "Terminal 1" }
  ])
  const [activeTerminal, setActiveTerminal] = useState("1")

  const addTerminal = () => {
    const newId = (terminals.length + 1).toString()
    setTerminals([...terminals, { id: newId, name: `Terminal ${newId}` }])
    setActiveTerminal(newId)
  }

  const removeTerminal = (id: string) => {
    setTerminals(terminals.filter(t => t.id !== id))
    if (activeTerminal === id) {
      setActiveTerminal(terminals[0]?.id || "1")
    }
  }

  if (!isVisible) return null;

  return (
    <div className="h-full bg-[#1e1e1e] border-t border-[#333333]">
      <Tabs value={activeTerminal} onValueChange={setActiveTerminal}>
        <div className="flex items-center border-b border-[#333333]">
          <TabsList className="h-9 bg-transparent border-b-0">
            {terminals.map(terminal => (
              <div key={terminal.id} className="flex items-center">
                <TabsTrigger
                  value={terminal.id}
                  className="px-3 h-8 data-[state=active]:bg-[#1e1e1e] data-[state=active]:border-t data-[state=active]:border-x border-[#333333] rounded-none"
                >
                  {terminal.name}
                </TabsTrigger>
                <button
                  onClick={() => removeTerminal(terminal.id)}
                  className="hover:bg-[#333333] p-1 rounded-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </TabsList>
          <button
            onClick={addTerminal}
            className="ml-2 p-1 hover:bg-[#333333] rounded-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {terminals.map(terminal => (
          <TabsContent
            key={terminal.id}
            value={terminal.id}
            className="p-2 text-sm font-mono text-[#cccccc]"
          >
            <div className="whitespace-pre">$ </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 