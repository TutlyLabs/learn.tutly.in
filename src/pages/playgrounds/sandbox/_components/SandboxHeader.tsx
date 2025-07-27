"use client";

import { SandpackProps } from "@codesandbox/sandpack-react";
import { actions } from "astro:actions";
import {
  ArrowLeft,
  Edit,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitAssignment from "@/pages/playgrounds/_components/SubmitAssignment";
import { templates } from "@/pages/playgrounds/templetes";

import { SandboxSettingsModal } from "./SandboxSettingsModal";

interface SandboxHeaderProps {
  template: string;
  templateName: string;
  isEditTemplate: boolean;
  isEditingTemplate: boolean;
  assignmentId?: string | null;
  currentUser?: any;
  onReset?: () => void;
  savedTemplate: SandpackProps;
  onConfigUpdate: (config: SandpackProps) => void;
}

function SandboxActions({
  assignmentId,
  isEditingTemplate,
  savedTemplate,
  onConfigUpdate,
}: {
  assignmentId: string | null;
  isEditingTemplate: boolean;
  savedTemplate: SandpackProps;
  onConfigUpdate: (config: SandpackProps) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveTemplate = async () => {
    if (!assignmentId) {
      console.error("No assignment ID found");
      return;
    }

    try {
      console.log("Saving template:", savedTemplate);

      const { data, error } = await actions.attachments_updateAttachmentSandboxTemplate({
        id: assignmentId,
        sandboxTemplate: savedTemplate,
      });

      if (data?.success && !error) {
        toast.success("Template updated successfully");
      } else {
        console.error("Save error:", error);
        toast.error("Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  return (
    <>
      {/* Settings Button - Show for everyone */}
      <Button
        variant="ghost"
        onClick={() => setShowSettings(true)}
        className="text-gray-300 hover:text-white"
        title="Sandbox Settings"
      >
        <Settings className="w-4 h-4" />
        Settings
      </Button>

      {/* Save Button - Only for editing templates */}
      {isEditingTemplate && assignmentId && (
        <Button
          variant="ghost"
          onClick={handleSaveTemplate}
          className="text-gray-300 hover:text-white"
          title="Save Template"
        >
          <Save className="w-4 h-4" />
          Save Template
        </Button>
      )}

      <SandboxSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(config) => onConfigUpdate(config)}
        savedTemplate={savedTemplate}
      />
    </>
  );
}

export function SandboxHeader({
  template,
  templateName,
  isEditTemplate,
  isEditingTemplate,
  assignmentId,
  currentUser,
  onReset,
  savedTemplate,
  onConfigUpdate,
}: SandboxHeaderProps) {
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

  const handleEdit = () => {
    window.open(
      `/playgrounds/sandbox?assignmentId=${assignmentId}&template=${template}&editTemplate=true`,
      "_blank"
    );
  };

  const handleTemplateChange = (newTemplate: string) => {
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);
    params.set("template", newTemplate);

    window.location.href = `${currentUrl.pathname}?${params.toString()}`;
  };

  return (
    <div className="h-10 px-4 flex items-center justify-between bg-background backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white">
          <a href="/playgrounds" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </a>
        </Button>
        <div className="text-sm font-medium text-white">{templateName} Playground</div>
      </div>

      <div className="flex items-center gap-2 -ml-48">
        {isEditTemplate && assignmentId && (
          <>
            {isEditingTemplate ? (
              <div className="flex items-center gap-2">
                <Select value={template} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.template} value={template.template}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SandboxActions
                  assignmentId={assignmentId ?? null}
                  isEditingTemplate={isEditingTemplate}
                  savedTemplate={savedTemplate}
                  onConfigUpdate={onConfigUpdate}
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={handleEdit}
                className="text-gray-300 hover:text-white"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </>
        )}

        {assignmentId && !isEditingTemplate && (
          <SubmitAssignment currentUser={currentUser} assignmentId={assignmentId} />
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="text-gray-300 hover:text-white"
            title="Reset to template"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-gray-300 hover:text-white"
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
