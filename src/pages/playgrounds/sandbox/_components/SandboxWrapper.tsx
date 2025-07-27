"use client";

import {
  SandpackPredefinedTemplate,
  SandpackProps,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { Attachment } from "@prisma/client";
import { useMemo, useState } from "react";

import { SandboxEmbed } from "./SandboxEmbed";
import { SandboxHeader } from "./SandboxHeader";
import { glassyTheme } from "./theme";

interface SandboxWrapperProps {
  template: string;
  templateName: string;
  canEditTemplate: boolean;
  isEditingTemplate: boolean;
  assignmentId?: string | null;
  assignment: Attachment | null;
  currentUser?: any;
}

export function SandboxWrapper({
  template,
  templateName,
  canEditTemplate,
  isEditingTemplate,
  assignmentId,
  assignment,
  currentUser,
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
        currentUser={currentUser}
        savedTemplate={currentConfig}
        onConfigUpdate={handleConfigUpdate}
      />
      <div className="flex-1 w-full h-full overflow-hidden">
        <SandboxEmbed assignment={assignment} isEditTemplate={canEditTemplate} config={config} />
      </div>
    </SandpackProvider>
  );
}
