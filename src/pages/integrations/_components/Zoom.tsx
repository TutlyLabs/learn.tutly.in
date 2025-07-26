import { Account } from "@prisma/client";
import { actions } from "astro:actions";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ZoomIntegration = ({ zoom }: { zoom?: Account | undefined }) => {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const handleUnlink = async () => {
    setIsUnlinking(true);
    await actions.oauth_unlinkAccount({ provider: "zoom" });
    window.location.reload();
  };
  const avatar = zoom?.avatar_url || "/integrations/zoom.png";
  const displayName = zoom?.email || zoom?.providerAccountId;
  return (
    <Accordion type="single" collapsible className="w-full mt-8">
      <AccordionItem value="zoom">
        <AccordionTrigger className="flex flex-row items-center gap-4 p-4">
          <div className="flex flex-row items-center gap-4">
            <img src="/integrations/zoom.png" alt="zoom" className="w-8 h-8 rounded-full border" />
            <span className="text-lg font-semibold">Zoom</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="flex flex-col gap-4">
            {zoom ? (
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={avatar} alt="zoom avatar" className="w-7 h-7 rounded-full border" />
                  <span className="font-mono text-sm text-blue-600">{displayName}</span>
                  {zoom.email && <span className="ml-2 text-xs text-gray-500">{zoom.email}</span>}
                </div>
                <button
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs border border-gray-300 disabled:opacity-60"
                >
                  {isUnlinking ? "Unlinking..." : "Unlink"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                <span className="text-gray-700 dark:text-gray-200">Not linked</span>
                <a
                  href="/api/auth/signin/zoom?link=true"
                  className="inline-block px-4 py-2 bg-[#2D8CFF] text-white rounded hover:bg-[#1a6ed8] transition-colors text-xs"
                >
                  Link Zoom
                </a>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
