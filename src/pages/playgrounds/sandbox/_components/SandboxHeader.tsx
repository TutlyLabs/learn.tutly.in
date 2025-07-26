"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Maximize2, Minimize2, Edit3 } from "lucide-react";

interface SandboxHeaderProps {
  sandboxId: string;
}

export function SandboxHeader({ sandboxId }: SandboxHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const container = document.querySelector('.h-screen');

    if (!document.fullscreenElement) {
      container?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200 bg-white backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <a
          href="/playgrounds"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
        <a
          href={`https://codesandbox.io/s/${sandboxId}?file=/src/App.js`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
        >
          <Edit3 className="w-3 h-3" />
          Edit
        </a>
        <a
          href={`https://codesandbox.io/s/${sandboxId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Open in CodeSandbox
        </a>
      </div>
    </div>
  );
} 