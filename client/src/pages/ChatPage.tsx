import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";
import { Loader2, Send, Activity } from "lucide-react";
import { ActionLogViewer } from "@/components/ActionLogViewer";

const SLASH_COMMANDS = [
  { name: "/engineer", description: "Create a new project with code generation" },
  { name: "/workflow", description: "Design and deploy a workflow" },
  { name: "/github", description: "Manage GitHub repositories" },
  { name: "/deploy", description: "Deploy to production" },
  { name: "/analyze", description: "Analyze code and provide insights" },
];

export default function ChatPage() {
  const [conversationId] = useState(() => nanoid());
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<typeof SLASH_COMMANDS>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showActionLog, setShowActionLog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatHistoryQuery = trpc.chat.getHistory.useQuery({
    conversationId,
    limit: 50,
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      chatHistoryQuery.refetch();
    },
  });

  const orchestratorMutation = trpc.orchestrator.invoke.useMutation();

  useEffect(() => {
    if (chatHistoryQuery.data) {
      setMessages(
        chatHistoryQuery.data.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    }
  }, [chatHistoryQuery.data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Handle slash command filtering
    if (value.includes("/")) {
      const lastSlashIndex = value.lastIndexOf("/");
      const afterSlash = value.substring(lastSlashIndex);

      if (afterSlash.includes(" ")) {
        // User has typed beyond the command
        setFilteredCommands([]);
      } else {
        // Filter commands by what's typed after /
        const filtered = SLASH_COMMANDS.filter((cmd) =>
          cmd.name.toLowerCase().startsWith(afterSlash.toLowerCase())
        );
        setFilteredCommands(filtered);
        setSelectedCommandIndex(0);
      }
    } else {
      setFilteredCommands([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCommands.length === 0) {
      if (e.key === "Enter" && !isLoading) {
        handleSendMessage();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedCommandIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedCommandIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        selectCommand(filteredCommands[selectedCommandIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setFilteredCommands([]);
        break;
    }
  };

  const selectCommand = (command: typeof SLASH_COMMANDS[0]) => {
    setInput(command.name + " ");
    setFilteredCommands([]);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setFilteredCommands([]);
    setIsLoading(true);

    try {
      // Save user message
      await sendMessageMutation.mutateAsync({
        conversationId,
        role: "user",
        content: userMessage,
      });

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      // Check if it's a slash command
      if (userMessage.startsWith("/")) {
        const command = userMessage.split(" ")[0];
        const params = userMessage.substring(command.length).trim();

        const result = await orchestratorMutation.mutateAsync({
          goal: params || "Execute command",
          action: command.substring(1),
          params: {},
        });

        // Extract job ID if available
        if (result && typeof result === "object" && "jobId" in result) {
          const jobId = (result as any).jobId;
          setCurrentJobId(jobId);
          setShowActionLog(true);
        }

        const assistantMessage = JSON.stringify(result, null, 2);
        await sendMessageMutation.mutateAsync({
          conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
      } else {
        // Regular chat message
        const assistantMessage = "I'm processing your request...";
        await sendMessageMutation.mutateAsync({
          conversationId,
          role: "assistant",
          content: assistantMessage,
        });

        setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {currentJobId && (
        <ActionLogViewer
          jobId={currentJobId}
          isOpen={showActionLog}
          onClose={() => setShowActionLog(false)}
        />
      )}

      <Card className="flex-1 flex flex-col bg-background border-border">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation or use a slash command (type /)</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <div className="relative">
        {filteredCommands.length > 0 && (
          <Card className="absolute bottom-full mb-2 w-full bg-popover border-border max-h-48 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.name}
                    onClick={() => selectCommand(cmd)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      idx === selectedCommandIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <p className="font-semibold">{cmd.name}</p>
                    <p className="text-xs text-muted-foreground">{cmd.description}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or / for commands..."
            className="flex-1"
            disabled={isLoading}
          />
          {showActionLog && currentJobId && (
            <Button
              onClick={() => setShowActionLog(!showActionLog)}
              variant="outline"
              size="icon"
              title="Toggle action log"
            >
              <Activity className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
