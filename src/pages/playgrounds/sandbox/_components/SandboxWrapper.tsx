"use client";

import {
  SandpackPredefinedTemplate,
  SandpackProps,
  SandpackProvider,
  SandpackTheme,
} from "@codesandbox/sandpack-react";
import { Attachment } from "@prisma/client";
import { useMemo, useState } from "react";

import { SandboxEmbed } from "./SandboxEmbed";
import { SandboxHeader } from "./SandboxHeader";

interface SandboxWrapperProps {
  template: string;
  templateName: string;
  canEditTemplate: boolean;
  isEditingTemplate: boolean;
  assignmentId?: string | null;
  assignment: Attachment | null;
}

const glassyTheme: SandpackTheme = {
  colors: {
    surface1: "#161618",
    surface2: "#1d1d20",
    surface3: "#222225",
    disabled: "#706e77",
    base: "#edecee",
    clickable: "#a1a0a7",
    hover: "#edecee",
    accent: "#00e0b8",
    error: "#ff666b",
    errorSurface: "rgba(255, 102, 107, 0.1)",
    warning: "#f0c000",
    warningSurface: "rgba(240, 192, 0, 0.1)",
  },
  syntax: {
    plain: "#edecee",
    comment: {
      color: "#a1a0a7",
      fontStyle: "italic" as const,
    },
    keyword: "#8099ff",
    tag: "#f76e99",
    punctuation: "#bf7af0",
    definition: "#9f8dfc",
    property: "#00c1d6",
    static: "#ffc266",
    string: "#70e1c8",
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    size: "14px",
    lineHeight: "1.6",
  },
};

export function SandboxWrapper({
  template,
  templateName,
  canEditTemplate,
  isEditingTemplate,
  assignmentId,
  assignment,
}: SandboxWrapperProps) {
  const config = {
    fileExplorer: !assignment || (canEditTemplate && isEditingTemplate),
    closableTabs: !assignment,
  };

  const baseTemplate: SandpackProps = useMemo(
    () => ({
      template: template as SandpackPredefinedTemplate,
      options: {
        closableTabs: config.closableTabs,
        readOnly: false,
        showTabs: true,
        showLineNumbers: true,
        showInlineErrors: true,
        wrapContent: true,
        showRefreshButton: true,
        showConsoleButton: true,
        showConsole: false,
      },
    }),
    [template, config.closableTabs]
  );

  const initialSavedTemplate = assignment?.sandboxTemplate as SandpackProps | null;

  const [currentConfig, setCurrentConfig] = useState<SandpackProps>(
    initialSavedTemplate || baseTemplate
  );

  const handleConfigUpdate = (newConfig: SandpackProps) => {
    setCurrentConfig(newConfig);
  };

  const sandpackProps: SandpackProps = {
    ...currentConfig,
    theme: glassyTheme,
  };

  return (
    <SandpackProvider {...sandpackProps}>
      <SandboxHeader
        assignmentId={assignmentId ?? null}
        template={template}
        templateName={templateName}
        isEditTemplate={canEditTemplate}
        isEditingTemplate={isEditingTemplate}
        savedTemplate={currentConfig}
        onConfigUpdate={handleConfigUpdate}
      />
      <div className="flex-1 w-full h-full overflow-hidden">
        <SandboxEmbed assignment={assignment} isEditTemplate={canEditTemplate} config={config} />
      </div>
    </SandpackProvider>
  );
}
