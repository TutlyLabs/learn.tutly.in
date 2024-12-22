import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, ExternalLink, Terminal, Lock } from "lucide-react"

export function Preview() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isConsoleVisible, setIsConsoleVisible] = useState(true)
  const [currentUrl, setCurrentUrl] = useState("https://google.com")
  const [firstInitOnloadFired, setFirstInitOnloadFired] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let strictIgnoreNextNavigation = false

    async function attachDevTools() {
      const iframeWindow = iframe?.contentWindow
      if (!iframeWindow) return

      return new Promise<boolean>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "//cdn.jsdelivr.net/npm/eruda"
        
        script.onload = () => {
          try {
            (iframeWindow as any).eval(
              "if (typeof eruda !== 'undefined') {" +
              "if (!window.__eruda_initialized) {" +
              "window.__eruda_initialized = true;" +
              "eruda.init({" +
              "container: null," +
              "tool: ['console', 'elements', 'network', 'resources', 'sources', 'info']," +
              "useShadowDom: true," +
              "autoScale: true," +
              "defaults: {" +
              "displaySize: 50," +
              "transparency: 0.9," +
              "theme: 'Dark'" +
              "}" +
              "});" +
              
              "const style = document.createElement('style');" +
              "style.textContent = " +
              "'#eruda {" +
              "position: fixed !important;" +
              "right: 0 !important;" +
              "bottom: 0 !important;" +
              "z-index: 1000 !important;" +
              "}" +
              ".eruda-entry-btn {" +
              "display: none !important;" +
              "}';" +
              "document.head.appendChild(style);" +
              "}" +
              
              "eruda.show();" +
              "window._eruda = eruda;" +
              "window._eruda._isShow = true;" +
              "}"
            )
            resolve(true)
          } catch (error) {
            reject(error)
          }
        }

        script.onerror = (e) => reject(e)
        iframe.contentDocument?.head.appendChild(script)
      })
    }

    async function domContentLoaded() {
      if (strictIgnoreNextNavigation) {
        strictIgnoreNextNavigation = false
        return
      }

      if (firstInitOnloadFired) return
      setFirstInitOnloadFired(true)

      try {
        if (errored) return
        
        // Update URL display
        setCurrentUrl(iframe?.contentWindow?.location.href || currentUrl)
        
        await attachDevTools()
        setFirstInitOnloadFired(false)
      } catch (error) {
        console.error("Error attaching devtools:", error)
        setErrored(true)
        if (iframe) {
          iframe.src = currentUrl
        }
      }
    }

    iframe.addEventListener("load", domContentLoaded)

    // Handle case when onload doesn't fire
    const timeout = setTimeout(() => {
      if (!firstInitOnloadFired) {
        setFirstInitOnloadFired(true)
        attachDevTools()
          .then(() => setFirstInitOnloadFired(false))
          .catch((error) => {
            console.error("Error in timeout attachDevTools:", error)
            setErrored(true)
            iframe.src = currentUrl
          })
      }
    }, 500)

    // Ensure console is visible on initial load
    const initTimeout = setTimeout(() => {
      const iframeWindow = iframe.contentWindow
      if (iframeWindow) {
        (iframeWindow as any).eval(`
          if (typeof eruda !== 'undefined') {
            eruda.show();
            window._eruda = eruda;
            window._eruda._isShow = true;
          }
        `)
      }
    }, 1000)

    return () => {
      iframe.removeEventListener("load", domContentLoaded)
      clearTimeout(timeout)
      clearTimeout(initTimeout)
    }
  }, [currentUrl, firstInitOnloadFired, errored])

  const handleRefresh = () => {
    const iframe = iframeRef.current
    if (iframe) {
      setErrored(false)
      setFirstInitOnloadFired(false)
      iframe.src = iframe.src
    }
  }

  const toggleConsole = () => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      (iframe.contentWindow as any).eval(`
        if (typeof eruda !== 'undefined') {
          if (eruda._isShow) {
            eruda.hide();
            eruda._isShow = false;
          } else {
            eruda.show();
            eruda._isShow = true;
          }
        }
      `)
      setIsConsoleVisible(!isConsoleVisible)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setCurrentUrl(newUrl)
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const iframe = iframeRef.current
    if (iframe && e.key === "Enter") {
      setErrored(false)
      setFirstInitOnloadFired(false)
      iframe.src = currentUrl
    }
  }

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      {/* URL Bar */}
      <div className="h-9 bg-[#2d2d2d] border-b border-[#333333] flex items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-[#3c3c3c]"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center bg-[#3c3c3c] rounded h-6 px-2">
          <Lock className="h-3 w-3 text-[#666666] mr-2" />
          <input
            type="text"
            value={currentUrl}
            onChange={handleUrlChange}
            onKeyDown={handleUrlKeyDown}
            className="bg-transparent border-none w-full text-sm text-[#cccccc] focus:outline-none"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-[#3c3c3c]"
          onClick={toggleConsole}
          title={isConsoleVisible ? "Hide Console" : "Show Console"}
        >
          <Terminal className={`h-4 w-4 ${isConsoleVisible ? "text-blue-500" : ""}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-[#3c3c3c]"
          asChild
        >
          <a 
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      </div>
    </div>
  )
} 