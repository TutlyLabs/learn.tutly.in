"use client";

import { Template } from "../templetes";
import { templates } from "../templetes";

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
