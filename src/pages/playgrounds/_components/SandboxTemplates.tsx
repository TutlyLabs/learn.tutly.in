"use client";

import { actions } from "astro:actions";
import { useState } from "react";
import { toast } from "sonner";
import { IoLogoHtml5 } from "react-icons/io5";
import { RiReactjsFill } from "react-icons/ri";
import { SiVuedotjs, SiNodedotjs, SiNextdotjs, SiAngular, SiTypescript } from "react-icons/si";
import { useRouter } from "@/hooks/use-router";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  template: string;
}

interface SandboxTemplatesProps {
  currentUser?: any;
  hasSandboxIntegration?: boolean;
}

const templates: Template[] = [
  {
    id: "kmwy42",
    name: "Vanilla",
    description: "HTML, CSS, and JavaScript",
    icon: IoLogoHtml5,
    color: "text-orange-600",
    template: "vanilla",
  },
  {
    id: "s267rm",
    name: "Vite",
    description: "React with JavaScript",
    icon: RiReactjsFill,
    color: "text-sky-400",
    template: "react",
  },
  {
    id: "7rp8q9",
    name: "Vite TypeScript",
    description: "React with TypeScript",
    icon: SiTypescript,
    color: "text-blue-600",
    template: "react-ts",
  },
  {
    id: "pb6sit",
    name: "Vue",
    description: "Vue.js framework",
    icon: SiVuedotjs,
    color: "text-green-600",
    template: "vue",
  },
  {
    id: "k8dsq1",
    name: "Node.js",
    description: "Node.js backend",
    icon: SiNodedotjs,
    color: "text-green-600",
    template: "node",
  },
  {
    id: "fxis37",
    name: "Next.js",
    description: "Next.js framework",
    icon: SiNextdotjs,
    color: "text-black",
    template: "nextjs",
  },
  {
    id: "angular",
    name: "Angular",
    description: "Angular framework",
    icon: SiAngular,
    color: "text-red-600",
    template: "angular",
  },
];

export default function SandboxTemplates({ currentUser, hasSandboxIntegration }: SandboxTemplatesProps) {
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const router = useRouter();

  const handleTemplateClick = async (template: Template) => {
    if (!template.id || !template.name) return;

    try {
      setLoadingTemplate(template.id);

      const result = await actions.sandbox_createSandboxWithSession({
        template: template.id,
        templateName: template.name,
      });

      if (result?.data?.ok) {
        router.push(`/playgrounds/sandbox?id=${result.data.sandboxId}`);
        toast.success(`${template.name} sandbox created successfully!`);
      } else {
        if (result?.data?.redirectTo) {
          window.location.href = result.data.redirectTo;
        } else {
          toast.error(result?.data?.error || "Failed to create sandbox");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoadingTemplate(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
        <p className="font-semibold">Authentication Required</p>
        <p>
          Please{" "}
          <a href="/auth/signin" className="underline">
            sign in
          </a>{" "}
          to use CodeSandbox templates.
        </p>
      </div>
    );
  }

  if (!hasSandboxIntegration) {
    return (
      <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded">
        <p className="font-semibold">CodeSandbox Integration Required</p>
        <p>
          Please set up your CodeSandbox integration in the{" "}
          <a href="/integrations" className="underline">
            Integrations tab
          </a>{" "}
          to use these templates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-10">
      {templates.map((template) => {
        const IconComponent = template.icon;
        const isLoading = loadingTemplate === template.id;

        return (
          <div
            key={template.id}
            className={`flex w-[350px] items-center gap-6 rounded-lg border-2 border-slate-300 p-3 px-5 hover:border-gray-500 dark:bg-white dark:text-black cursor-pointer transition-colors ${isLoading ? "opacity-50 pointer-events-none" : ""
              }`}
            onClick={() => handleTemplateClick(template)}
          >
            <div>
              <div
                className={`h-20 w-20 rounded-md bg-slate-200 p-2 flex items-center justify-center ${template.color}`}
              >
                <IconComponent className="h-12 w-12" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold">{template.name}</h1>
              <p className="text-sm text-slate-500">{template.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
