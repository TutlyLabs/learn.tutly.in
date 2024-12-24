import { useState, useRef, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, X } from "lucide-react"
import { socket } from "@/lib/socket"
import XTerm from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";

type XtermTerminal = any;

interface Terminal {
  id: string;
  name: string;
  terminal: XtermTerminal | null;
}

interface TerminalProps {
  isVisible?: boolean;
}

export function Terminal({ isVisible = true }: TerminalProps) {
  const terminalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: "1", name: "Terminal 1", terminal: null }
  ])
  const [activeTerminal, setActiveTerminal] = useState("1")

  useEffect(() => {
    terminals.forEach(({ id }) => {
      if (!terminalRefs.current[id]) return;

      const term = new XTerm.Terminal({
        cursorBlink: true,
        theme: {
          background: "#1e1e1e",
          foreground: "#cccccc"
        }
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(terminalRefs.current[id]!);
      fitAddon.fit();

      setTerminals(prev => 
        prev.map(t => 
          t.id === id ? { ...t, terminal: term } : t
        )
      );

      socket.on("terminal-output", (data: string) => {
        term.write(data);
      });

      term.onData(data => {
        socket.emit("terminal-input", data);
      });
    });

    return () => {
      terminals.forEach(({ terminal }) => {
        if (terminal) {
          terminal.dispose();
        }
      });
    };
  }, [terminals.length]);

  const addTerminal = () => {
    const newId = (terminals.length + 1).toString()
    setTerminals([...terminals, { id: newId, name: `Terminal ${newId}`, terminal: null }])
    setActiveTerminal(newId)
  }

  const removeTerminal = (id: string) => {
    const terminalToRemove = terminals.find(t => t.id === id)
    if (terminalToRemove?.terminal) {
      terminalToRemove.terminal.dispose()
    }
    
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
            className="h-full"
          >
            <div 
              ref={el => terminalRefs.current[terminal.id] = el} 
              className="h-full"
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 