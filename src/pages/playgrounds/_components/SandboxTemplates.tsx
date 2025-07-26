"use client";

import { IoLogoHtml5 } from "react-icons/io5";
import { RiReactjsFill } from "react-icons/ri";
import { SiVuedotjs, SiNodedotjs, SiNextdotjs, SiAngular, SiTypescript } from "react-icons/si";

interface Template {
  name: string;
  description: string;
  icon: any;
  color: string;
  template: string;
}

const templates: Template[] = [
  {
    name: "Vanilla",
    description: "HTML, CSS, and JavaScript",
    icon: IoLogoHtml5,
    color: "text-orange-600",
    template: "vanilla",
  },
  {
    name: "Vite + React",
    description: "React with Vite bundler",
    icon: RiReactjsFill,
    color: "text-sky-400",
    template: "vite-react",
  },
  {
    name: "Vite + React TS",
    description: "React with TypeScript and Vite",
    icon: SiTypescript,
    color: "text-blue-600",
    template: "vite-react-ts",
  },
  {
    name: "Node.js",
    description: "Node.js backend",
    icon: SiNodedotjs,
    color: "text-green-600",
    template: "node",
  },
  {
    name: "Next.js",
    description: "Next.js framework",
    icon: SiNextdotjs,
    color: "text-black",
    template: "nextjs",
  },
  {
    name: "Angular",
    description: "Angular framework",
    icon: SiAngular,
    color: "text-red-600",
    template: "angular",
  },
  {
    name: "Vue",
    description: "Vue.js framework",
    icon: SiVuedotjs,
    color: "text-green-600",
    template: "vue",
  },
];

export default function SandboxTemplates() {
  const handleTemplateClick = (template: Template) => {
    window.location.href = `/playgrounds/sandbox?template=${template.template}&name=${encodeURIComponent(template.name)}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => {
        const IconComponent = template.icon;

        return (
          <div
            key={template.template}
            className="flex items-center gap-6 rounded-lg border-2 border-slate-300 p-3 px-5 hover:border-gray-500 dark:bg-white dark:text-black cursor-pointer transition-colors"
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
