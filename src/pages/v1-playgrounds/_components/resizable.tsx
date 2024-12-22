import { GripVertical, GripHorizontal } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "@/lib/utils"

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
  orientation?: "horizontal" | "vertical"
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-[#333333] after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-[#333333] bg-[#252526]">
        {orientation === "vertical" ? (
          <GripHorizontal className="h-2.5 w-2.5" />
        ) : (
          <GripVertical className="h-2.5 w-2.5" />
        )}
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export {
  ResizablePrimitive,
  ResizablePanel,
  ResizableHandle,
} 