import { Account } from "@prisma/client";
import { actions } from "astro:actions";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const GithubIntegration = ({ github }: { github?: Account | undefined }) => {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const handleUnlink = async () => {
    setIsUnlinking(true);
    await actions.oauth_unlinkAccount({ provider: "github" });
    window.location.reload();
  };
  const avatar = github?.avatar_url || "/integrations/github.png";
  const displayName = github?.username || github?.providerAccountId;
  const profileUrl = github?.username ? `https://github.com/${github.username}` : undefined;
  return (
    <Accordion type="single" collapsible className="w-full mt-8">
      <AccordionItem value="github">
        <AccordionTrigger className="flex flex-row items-center gap-4 p-4">
          <div className="flex flex-row items-center gap-4">
            <img
              src="/integrations/github.png"
              alt="github"
              className="w-8 h-8 rounded-full bg-white"
            />
            <span className="text-lg font-semibold">GitHub</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="flex flex-col gap-4">
            {github ? (
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={avatar} alt="github avatar" className="w-7 h-7 rounded-full border" />
                  {profileUrl ? (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:underline"
                    >
                      {displayName}
                    </a>
                  ) : (
                    <span className="font-mono text-sm text-blue-600">{displayName}</span>
                  )}
                  {github.email && (
                    <span className="ml-2 text-xs text-gray-500">{github.email}</span>
                  )}
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
                  href="/api/auth/signin/github?link=true"
                  className="inline-block px-4 py-2 bg-[#24292e] text-white rounded hover:bg-[#1c2128] transition-colors text-xs"
                >
                  Link GitHub
                </a>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
