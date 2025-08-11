import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { actions } from "astro:actions";

type N8nWorkflow = {
  id: string | number;
  name: string;
  active?: boolean;
  [key: string]: any;
};

type Execution = {
  id: number;
  workflowId: number;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  [key: string]: any;
};

type FetchState = "idle" | "loading" | "success" | "error";

export default function WorkflowsManager() {
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [workflowDetails, setWorkflowDetails] = useState<any>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchWorkflows() {
    setError(null);
    setFetchState("loading");
    const res = await actions.workflows_listWorkflows();
    const payload: any = res?.data ?? res;
    if (payload?.error) {
      setError(payload.error);
      setFetchState("error");
      return;
    }
    if (payload?.success) {
      setWorkflows(payload.data as N8nWorkflow[]);
      setFetchState("success");
      return;
    }
    setError("Failed to fetch workflows");
    setFetchState("error");
  }

  async function toggleWorkflowActive(wf: N8nWorkflow) {
    const res = await actions.workflows_toggleWorkflow({ id: wf.id as any, active: !!wf.active });
    const payload: any = res?.data ?? res;
    if (payload?.error) {
      setError(payload.error);
      return;
    }
    setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? { ...w, active: !wf.active } : w)));
  }

  async function deleteWorkflow(wf: N8nWorkflow) {
    if (!confirm(`Are you sure you want to delete workflow "${wf.name}"?`)) return;

    const res = await actions.workflows_deleteWorkflow({ id: wf.id as any });
    const payload: any = res?.data ?? res;
    if (payload?.error) {
      setError(payload.error);
      return;
    }
    setWorkflows((prev) => prev.filter((w) => w.id !== wf.id));
  }

  async function viewWorkflowDetails(wf: N8nWorkflow) {
    setSelectedWorkflow(wf);
    const res = await actions.workflows_getWorkflow({ id: wf.id as any });
    const payload: any = res?.data ?? res;
    if (payload?.error) {
      setError(payload.error);
      return;
    }
    setWorkflowDetails(payload.data);
  }

  async function viewExecutions(wf: N8nWorkflow) {
    setSelectedWorkflow(wf);
    const res = await actions.workflows_getExecutions({
      workflowId: wf.id as any,
      limit: 20,
      includeData: false
    });
    const payload: any = res?.data ?? res;
    if (payload?.error) {
      setError(payload.error);
      return;
    }
    setExecutions(payload.data?.data || []);
  }

  function getExecutionStatusColor(status: string) {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
      case "waiting": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return (
    <div className="w-full">
      {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="details">Workflow Details</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6 space-y-4">
          {fetchState === "loading" ? (
            <div className="text-sm text-muted-foreground">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No workflows found.</div>
          ) : (
            workflows.map((wf) => (
              <div key={String(wf.id)} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{wf.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {String(wf.id)} • Active: {String(!!wf.active)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Active</span>
                      <Switch checked={!!wf.active} onClick={() => toggleWorkflowActive(wf)} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewWorkflowDetails(wf)}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewExecutions(wf)}
                    >
                      Executions
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWorkflow(wf)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="executions" className="mt-6 space-y-4">
          {selectedWorkflow ? (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">Executions for: {selectedWorkflow.name}</h3>
                <p className="text-sm text-muted-foreground">Recent workflow executions</p>
              </div>
              {executions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No executions found.</div>
              ) : (
                <div className="space-y-2">
                  {executions.map((exec) => (
                    <div key={exec.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Execution #{exec.id}</div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(exec.startedAt).toLocaleString()}
                            {exec.stoppedAt && ` • Stopped: ${new Date(exec.stoppedAt).toLocaleString()}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getExecutionStatusColor(exec.finished ? "success" : "waiting")}>
                            {exec.finished ? "Completed" : "Running"}
                          </Badge>
                          <Badge variant="outline">{exec.mode}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a workflow to view its executions.
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-6 space-y-4">
          {workflowDetails ? (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">Workflow Details</h3>
                <p className="text-sm text-muted-foreground">Detailed information about the workflow</p>
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <span className="font-medium">Name:</span> {workflowDetails.name}
                </div>
                <div>
                  <span className="font-medium">ID:</span> {workflowDetails.id}
                </div>
                <div>
                  <span className="font-medium">Active:</span> {String(!!workflowDetails.active)}
                </div>
                <div>
                  <span className="font-medium">Nodes:</span> {workflowDetails.nodes?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(workflowDetails.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {new Date(workflowDetails.updatedAt).toLocaleString()}
                </div>
                {workflowDetails.nodes && workflowDetails.nodes.length > 0 && (
                  <div>
                    <span className="font-medium">Node Types:</span>
                    <div className="mt-2 space-y-1">
                      {workflowDetails.nodes.map((node: any, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {node.name} ({node.type})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a workflow to view its details.
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="mt-6 space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-medium">Utilities</div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={fetchWorkflows} variant="outline">
                Refresh Workflows
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              All requests are handled securely in the background.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 