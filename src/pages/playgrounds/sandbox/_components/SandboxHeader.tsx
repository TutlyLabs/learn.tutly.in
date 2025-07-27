"use client";

import { ArrowLeft, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface SandboxHeaderProps {
  templateName: string;
  onReset?: () => void;
}

export function SandboxHeader({ templateName, onReset }: SandboxHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const container = document.querySelector(".h-screen");

    if (!document.fullscreenElement) {
      container?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="h-10 px-4 flex items-center justify-between bg-background backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <a
          href="/playgrounds"
          className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>
        <div className="text-sm font-medium text-white">{templateName} Playground</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {onReset && (
          <button
            onClick={onReset}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            title="Reset to template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
