import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ConnectorsPage() {
  const [connectorType, setConnectorType] = useState<"github" | "huggingface" | "vercel">("github");
  const [connectorName, setConnectorName] = useState("");
  const [connectorToken, setConnectorToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const connectorsQuery = trpc.connectors.list.useQuery();
  const saveConnectorMutation = trpc.connectors.save.useMutation({
    onSuccess: () => {
      connectorsQuery.refetch();
      setConnectorName("");
      setConnectorToken("");
      toast.success("Connector saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save connector: ${error.message}`);
    },
  });

  const deleteConnectorMutation = trpc.connectors.delete.useMutation({
    onSuccess: () => {
      connectorsQuery.refetch();
      toast.success("Connector deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete connector: ${error.message}`);
    },
  });

  const handleSaveConnector = async () => {
    if (!connectorName.trim() || !connectorToken.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await saveConnectorMutation.mutateAsync({
        type: connectorType,
        name: connectorName,
        token: connectorToken,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConnector = (connectorId: number) => {
    deleteConnectorMutation.mutate({ connectorId });
  };

  const connectorDescriptions: Record<"github" | "huggingface" | "vercel", string> = {
    github: "GitHub Personal Access Token for repository management",
    huggingface: "HuggingFace API token for model access",
    vercel: "Vercel API token for deployment management",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Connectors</h2>
        <p className="text-muted-foreground">Manage your external service integrations</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold mb-4">Add New Connector</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="connector-type">Service Type</Label>
            <Select value={connectorType} onValueChange={(value: any) => setConnectorType(value)}>
              <SelectTrigger id="connector-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="huggingface">HuggingFace</SelectItem>
                <SelectItem value="vercel">Vercel</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {connectorDescriptions[connectorType]}
            </p>
          </div>

          <div>
            <Label htmlFor="connector-name">Connector Name</Label>
            <Input
              id="connector-name"
              value={connectorName}
              onChange={(e) => setConnectorName(e.target.value)}
              placeholder="e.g., My GitHub Account"
            />
          </div>

          <div>
            <Label htmlFor="connector-token">API Token</Label>
            <Input
              id="connector-token"
              type="password"
              value={connectorToken}
              onChange={(e) => setConnectorToken(e.target.value)}
              placeholder="Paste your API token here"
            />
          </div>

          <Button
            onClick={handleSaveConnector}
            disabled={isLoading || !connectorName.trim() || !connectorToken.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 w-4 h-4" />
                Add Connector
              </>
            )}
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Your Connectors</h3>
        <div className="space-y-2">
          {connectorsQuery.isLoading ? (
            <Card className="p-4 text-center text-muted-foreground">
              <Loader2 className="inline animate-spin mr-2" />
              Loading connectors...
            </Card>
          ) : connectorsQuery.data && connectorsQuery.data.length > 0 ? (
            connectorsQuery.data.map((connector) => (
              <Card key={connector.id} className="p-4 flex items-center justify-between bg-card border-border">
                <div>
                  <p className="font-semibold">{connector.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{connector.type}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteConnector(connector.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))
          ) : (
            <Card className="p-4 text-center text-muted-foreground">
              No connectors yet. Add one to get started.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
