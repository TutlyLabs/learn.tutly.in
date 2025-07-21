const StaticConsole = ({ logs, onClear }: { logs: string[]; onClear: () => void }) => {
  return (
    <div className="h-full bg-white flex flex-col overflow-y-scroll">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h1 className="text-lg font-semibold text-gray-600">Console</h1>
        <button
          className="rounded bg-blue-500 px-2 py-1 text-white text-xs hover:bg-blue-600"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 text-sm font-mono">
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center">No console output yet.</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaticConsole;
