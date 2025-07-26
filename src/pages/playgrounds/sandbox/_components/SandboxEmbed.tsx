"use client";

import { useState } from "react";

interface SandboxEmbedProps {
  sandboxId: string;
}

export function SandboxEmbed({ sandboxId }: SandboxEmbedProps) {
  const [error, setError] = useState<string | null>(null);

  const iframeSrc = `https://codesandbox.io/p/sandbox/${sandboxId}?embed=1&file=%2Findex.html`;

  const handleIframeError = () => {
    setError("Failed to load sandbox");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a
            href={`https://codesandbox.io/s/${sandboxId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open in CodeSandbox
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <iframe
        src={iframeSrc}
        className="h-full w-full border-0"
        title="CodeSandbox"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        onError={handleIframeError}
        referrerPolicy="unsafe-url"
      />
    </div>
  );
} 
