import { defineAction } from "astro:actions";
import { z } from "zod";

const BASE_URL = import.meta.env.N8N_BASE_URL as string;
const API_KEY = import.meta.env.N8N_API_KEY as string;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (API_KEY) headers["X-N8N-API-KEY"] = API_KEY;
  return headers;
}

export const listWorkflows = defineAction({
  async handler() {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/workflows`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const data = await res.json();
      const workflows = Array.isArray(data) ? data : data?.data || [];
      return { success: true, data: workflows };
    } catch (e) {
      return { error: `Failed to fetch workflows: ${e}` };
    }
  },
});

export const getWorkflow = defineAction({
  input: z.object({ id: z.union([z.string(), z.number()]) }),
  async handler({ id }) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/workflows/${id}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const workflow = await res.json();
      return { success: true, data: workflow };
    } catch (e) {
      return { error: `Failed to fetch workflow: ${e}` };
    }
  },
});

export const toggleWorkflow = defineAction({
  input: z.object({ id: z.union([z.string(), z.number()]), active: z.boolean() }),
  async handler({ id, active }) {
    try {
      const path = active ? `/workflows/${id}/deactivate` : `/workflows/${id}/activate`;
      const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      return { success: true };
    } catch (e) {
      return { error: `Failed to toggle workflow: ${e}` };
    }
  },
});

export const createWorkflow = defineAction({
  input: z.object({
    name: z.string(),
    nodes: z.array(z.any()),
    connections: z.record(z.any()),
    settings: z.record(z.any()).optional(),
  }),
  async handler({ name, nodes, connections, settings }) {
    try {
      const workflowData = {
        name,
        nodes,
        connections,
        settings: settings || {},
      };

      const res = await fetch(`${BASE_URL}/api/v1/workflows`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(workflowData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const result = await res.json();
      return { success: true, data: result };
    } catch (e) {
      return { error: `Failed to create workflow: ${e}` };
    }
  },
});

export const updateWorkflow = defineAction({
  input: z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    nodes: z.array(z.any()).optional(),
    connections: z.record(z.any()).optional(),
    settings: z.record(z.any()).optional(),
  }),
  async handler({ id, ...updateData }) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/workflows/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const result = await res.json();
      return { success: true, data: result };
    } catch (e) {
      return { error: `Failed to update workflow: ${e}` };
    }
  },
});

export const deleteWorkflow = defineAction({
  input: z.object({ id: z.union([z.string(), z.number()]) }),
  async handler({ id }) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/workflows/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      return { success: true };
    } catch (e) {
      return { error: `Failed to delete workflow: ${e}` };
    }
  },
});

export const getExecutions = defineAction({
  input: z.object({
    workflowId: z.union([z.string(), z.number()]).optional(),
    status: z.enum(["error", "success", "waiting"]).optional(),
    limit: z.number().optional(),
    includeData: z.boolean().optional(),
  }),
  async handler({ workflowId, status, limit, includeData }) {
    try {
      const params = new URLSearchParams();
      if (workflowId) params.append("workflowId", String(workflowId));
      if (status) params.append("status", status);
      if (limit) params.append("limit", String(limit));
      if (includeData) params.append("includeData", String(includeData));

      const res = await fetch(`${BASE_URL}/api/v1/executions?${params}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const data = await res.json();
      return { success: true, data };
    } catch (e) {
      return { error: `Failed to fetch executions: ${e}` };
    }
  },
});

export const getWorkflowTags = defineAction({
  input: z.object({ id: z.union([z.string(), z.number()]) }),
  async handler({ id }) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/workflows/${id}/tags`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const tags = await res.json();
      return { success: true, data: tags };
    } catch (e) {
      return { error: `Failed to fetch workflow tags: ${e}` };
    }
  },
});

export const updateWorkflowTags = defineAction({
  input: z.object({
    id: z.union([z.string(), z.number()]),
    tagIds: z.array(z.object({ id: z.string() })),
  }),
  async handler({ id, tagIds }) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/workflows/${id}/tags`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(tagIds),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: `HTTP ${res.status}: ${errorText}` };
      }

      const result = await res.json();
      return { success: true, data: result };
    } catch (e) {
      return { error: `Failed to update workflow tags: ${e}` };
    }
  },
});
