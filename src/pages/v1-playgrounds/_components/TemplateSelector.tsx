import { useState } from 'react';
import { socket } from '@/lib/socket';

const templates = [
  { id: 'node', name: 'Node.js' },
  { id: 'react', name: 'React' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'astro', name: 'Astro' }
];

export default function TemplateSelector() {
  const [loading, setLoading] = useState(false);

  const createEnvironment = async (templateId: string) => {
    setLoading(true);
    
    socket.emit("create-environment", { template: templateId });
    
    socket.once("environment-ready", (data: { containerId: string }) => {
      setLoading(false);
      window.location.href = `/v1-playgrounds/environment/${data.containerId}`;
    });

    socket.once("error", (error: { message: string }) => {
      setLoading(false);
      alert(error.message);
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => createEnvironment(template.id)}
            disabled={loading}
            className="p-4 border rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}