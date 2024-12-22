import { useState } from "react"
import { useFileSystem } from "../file-system-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search,
  Replace,
  ChevronDown,
  FileIcon,
  MoreVertical,
  RefreshCw,
  ChevronsRight,
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  file: {
    path: string;
    content: string;
  }
  matches: {
    line: number
    content: string
    start: number
    end: number
  }[]
}

export function SearchView() {
  const { files, openFile } = useFileSystem()
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [showReplace, setShowReplace] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  const toggleFileExpanded = (filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }

  const searchInFiles = () => {
    if (!searchQuery) return

    setIsSearching(true)
    const searchResults: SearchResult[] = []

    const flattenFiles = (items: any[]): any[] => {
      return items.reduce((acc: any[], item: any) => {
        if (item.type === "file") {
          return [...acc, item]
        }
        if (item.children) {
          return [...acc, ...flattenFiles(item.children)]
        }
        return acc
      }, [])
    }

    const allFiles = flattenFiles(files)

    allFiles.forEach(file => {
      if (!file.content) return

      const matches: SearchResult["matches"] = []
      const lines = file.content.split("\n")

      lines.forEach((line: string, lineIndex: number) => {
        let searchRegex: RegExp

        if (regex) {
          try {
            searchRegex = new RegExp(searchQuery, caseSensitive ? "g" : "gi")
          } catch {
            searchRegex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi")
          }
        } else {
          searchRegex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi")
        }

        if (wholeWord) {
          searchRegex = new RegExp(`\\b${searchQuery}\\b`, caseSensitive ? "g" : "gi")
        }

        let match
        while ((match = searchRegex.exec(line)) !== null) {
          matches.push({
            line: lineIndex + 1,
            content: line,
            start: match.index,
            end: match.index + match[0].length
          })
        }
      })

      if (matches.length > 0) {
        searchResults.push({
          file: {
            path: file.path,
            content: file.content
          },
          matches
        })
      }
    })

    setResults(searchResults)
    setExpandedFiles(new Set(searchResults.map(r => r.file.path)))
    setIsSearching(false)
  }

  const handleMatchClick = (result: SearchResult, match: SearchResult["matches"][0]) => {
    const file = flattenFiles(files).find(f => f.path === result.file.path)
    if (file) {
      openFile(file)
      // TODO: Scroll to line in editor
    }
  }

  const flattenFiles = (items: any[]): any[] => {
    return items.reduce((acc: any[], item: any) => {
      if (item.type === "file") {
        return [...acc, item]
      }
      if (item.children) {
        return [...acc, ...flattenFiles(item.children)]
      }
      return acc
    }, [])
  }

  const handleFileClick = (e: React.MouseEvent, filePath: string) => {
    if (!(e.target as HTMLElement).closest('button')) {
      toggleFileExpanded(filePath)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      {/* Search Input Section */}
      <div className="p-4 space-y-2">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchInFiles()
            }}
            placeholder="Search"
            className="bg-[#3c3c3c] border-[#3c3c3c] text-sm h-7 pl-8 pr-24"
          />
          <Search className="absolute left-2 top-1.5 h-4 w-4 text-[#858585]" />
          <div className="absolute right-2 top-1 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-0.5 hover:bg-[#404040] rounded-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowReplace(!showReplace)}
              className={cn(
                "p-0.5 hover:bg-[#404040] rounded-sm",
                showReplace && "bg-[#404040]"
              )}
              title="Toggle Replace"
            >
              <Replace className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={cn(
                "p-0.5 hover:bg-[#404040] rounded-sm text-xs font-bold",
                caseSensitive && "bg-[#404040]"
              )}
              title="Match Case"
            >
              Aa
            </button>
            <button
              onClick={() => setWholeWord(!wholeWord)}
              className={cn(
                "p-0.5 hover:bg-[#404040] rounded-sm",
                wholeWord && "bg-[#404040]"
              )}
              title="Match Whole Word"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setRegex(!regex)}
              className={cn(
                "p-0.5 hover:bg-[#404040] rounded-sm text-xs font-bold",
                regex && "bg-[#404040]"
              )}
              title="Use Regular Expression"
            >
              .*
            </button>
          </div>
        </div>

        {showReplace && (
          <div className="relative">
            <Input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace"
              className="bg-[#3c3c3c] border-[#3c3c3c] text-sm h-7 pl-8"
            />
            <Replace className="absolute left-2 top-1.5 h-4 w-4 text-[#858585]" />
          </div>
        )}
      </div>

      {/* Results Section */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5">
          {results.map((result) => (
            <div key={result.file.path} className="text-[13px]">
              <div 
                className="flex items-center px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer group"
                onClick={(e) => handleFileClick(e, result.file.path)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFileExpanded(result.file.path)
                  }}
                  className="p-1 hover:bg-[#404040] rounded-sm"
                >
                  {expandedFiles.has(result.file.path) ? (
                    <ChevronDown className="h-4 w-4 text-[#858585]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#858585]" />
                  )}
                </button>
                <FileIcon className="h-4 w-4 ml-1 mr-2 text-[#858585]" />
                <span className="flex-1">{result.file.path}</span>
                <span className="text-[#858585] mr-2">{result.matches.length} results</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-[#404040]"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log("Menu clicked for", result.file.path)
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              {expandedFiles.has(result.file.path) && (
                <div className="space-y-0.5">
                  {result.matches.map((match, index) => (
                    <div
                      key={index}
                      className="flex items-start py-0.5 px-4 hover:bg-[#2a2d2e] cursor-pointer group"
                      onClick={() => handleMatchClick(result, match)}
                    >
                      <span className="w-8 text-right mr-2 text-[#858585] text-[12px]">
                        {match.line}
                      </span>
                      <span className="flex-1 font-mono text-[12px] whitespace-pre">
                        {match.content.slice(0, match.start)}
                        <span className="bg-[#613214] text-[#ffb366]">
                          {match.content.slice(match.start, match.end)}
                        </span>
                        {match.content.slice(match.end)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isSearching && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!isSearching && results.length === 0 && searchQuery && (
            <div className="text-center py-4 text-[13px] text-[#858585]">
              No results found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 