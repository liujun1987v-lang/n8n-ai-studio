import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

export interface ActionLog {
  type: "connected" | "action";
  action?: string;
  status?: "pending" | "running" | "success" | "error";
  details?: string;
  timestamp: string;
}

interface ActionLogViewerProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ActionLogViewer({ jobId, isOpen, onClose }: ActionLogViewerProps) {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Connection effect - runs unconditionally
  useEffect(() => {
    if (!isOpen || !jobId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/stream/actions/${jobId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ActionLog;
        setLogs((prev) => [...prev, data]);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 0);
      } catch (err) {
        console.error("Failed to parse action log:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("Connection lost. Reconnecting...");
      // Don't close - let EventSource handle reconnection automatically
    };

    eventSourceRef.current = eventSource;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isOpen, jobId]);

  // Error auto-dismiss effect - runs unconditionally
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Early return for UI - after all hooks
  if (!isOpen) {
    return null;
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "running":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-96 bg-card border-border shadow-lg flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Action Log</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Waiting for actions...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="text-sm space-y-1">
                {log.type === "action" && (
                  <>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="font-medium">{log.action}</span>
                      {log.status && (
                        <Badge variant={getStatusBadgeVariant(log.status)} className="text-xs">
                          {log.status}
                        </Badge>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground ml-6">{log.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground ml-6">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        {logs.length} action{logs.length !== 1 ? "s" : ""} logged
      </div>
    </Card>
  );
}
