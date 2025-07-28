import { actions } from "astro:actions";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Bug,
  Calendar,
  Code,
  Database,
  MessageSquare,
  Send,
  Star,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import MarkdownPreview from "@/components/MarkdownPreview";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SessionUser } from "@/lib/auth/session";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "assistant-debug";
  content: string;
  timestamp: Date;
  queryExecuted?: string;
  queryResults?: any;
  isThinking?: boolean;
}

interface AIChatProps {
  user: SessionUser;
}

interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
  version: string;
}

const EXAMPLE_QUERIES = [
  {
    icon: Calendar,
    text: "Latest assignments in my course",
    category: "Assignments",
    detailed: "Show me the 5 most recently created assignments in my course",
  },
  {
    icon: Users,
    text: "Mentors in my course",
    category: "Mentors",
    detailed: "Who are the mentors assigned to my course?",
  },
  {
    icon: Star,
    text: "Top 3 scores in latest quiz",
    category: "Scores",
    detailed: "Show me top 3 scores in my latest quiz",
  },
  {
    icon: BookOpen,
    text: "My active courses count",
    category: "Courses",
    detailed: "How many active courses am I teaching?",
  },
  {
    icon: BarChart3,
    text: "Submissions for latest assignment",
    category: "Submissions",
    detailed: "How many submissions are there for my latest assignment?",
  },
  {
    icon: Bell,
    text: "Pending submissions count",
    category: "Status",
    detailed: "How many pending submissions do I have across all courses?",
  },
  {
    icon: MessageSquare,
    text: "Latest 3 discussion posts",
    category: "Discussions",
    detailed: "Show me the 3 most recent discussion posts in my courses",
  },
  {
    icon: Database,
    text: "Students in my course",
    category: "Enrollment",
    detailed: "How many students are enrolled in my course?",
  },
  {
    icon: Calendar,
    text: "Due assignments this week",
    category: "Deadlines",
    detailed: "What assignments are due this week in my courses?",
  },
  {
    icon: BarChart3,
    text: "Average score for latest assignment",
    category: "Performance",
    detailed: "What's the average score for my latest assignment?",
  },
  {
    icon: Users,
    text: "Active students today",
    category: "Activity",
    detailed: "How many students were active today?",
  },
  {
    icon: Star,
    text: "Highest scorer in my course",
    category: "Achievement",
    detailed: "Who has the highest overall score in my course?",
  },
];

export default function AIChat({ user }: AIChatProps) {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("models/gemini-2.0-flash");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `## Hey ${user.name}! 👋

I'm your **smart AI assistant** for Tutly. I can help you explore your learning data by generating and executing database queries in real-time.

**Just ask me anything in plain English!** I'll figure out the right query to get you the information you need.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await actions.aiQuery_getAvailableModels({});
        if (response.data?.ok) {
          setAvailableModels(response.data.models);
          if (response.data.models.length > 0) {
            const defaultModel =
              response.data.models.find((m: ModelInfo) => m.name.includes("2.0-flash")) ||
              response.data.models[0];
            setSelectedModel(defaultModel.name);
          }
        } else {
          console.error("Failed to fetch models:", response.data?.error);
          toast.error("Failed to load available models");
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        toast.error("Failed to load available models");
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      let thinkingMessageId: string | null = null;
      if (debugMode) {
        const thinkingMessage: Message = {
          id: `thinking-${Date.now()}`,
          role: "assistant",
          content: "🤔 **Generating database query** and analyzing your data...",
          timestamp: new Date(),
          isThinking: true,
        };
        thinkingMessageId = thinkingMessage.id;

        setMessages((prev) => [...prev, thinkingMessage]);
      }

      const response = await actions.aiQuery_executeAIQueryCombined({
        userQuery: messageText,
        previousContext: conversationContext,
        selectedModel: selectedModel,
      });

      if (thinkingMessageId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== thinkingMessageId));
      }

      if (response.data?.ok) {
        const { query, data, response: aiResponse } = response.data;

        const messages: Message[] = [];

        const queryMessage: Message = {
          id: `query-${Date.now()}`,
          role: "assistant-debug",
          content: "📋 **Database Query Executed:**",
          timestamp: new Date(),
          queryExecuted: query,
          queryResults: data,
        };
        messages.push(queryMessage);

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };
        messages.push(assistantMessage);

        setMessages((prev) => [...prev, ...messages]);

        setConversationContext(
          (prev) =>
            `${prev}\nUser: ${messageText}\nQuery: ${query}\nResults: ${JSON.stringify(data)}\nResponse: ${aiResponse}`
        );
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: response.data?.error?.includes("No Gemini API key")
            ? "⚠️ **Configuration Required**\n\nPlease configure your **Gemini API key** in the [Integrations page](/integrations) to use the AI assistant."
            : `❌ **Error**\n\n${response.data?.error || "Sorry, I encountered an error processing your request. Please try again."}`,
          timestamp: new Date(),
          queryExecuted: response.data?.query,
        };

        setMessages((prev) => [...prev, errorMessage]);
        toast.error("Failed to process request");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => prev.filter((msg): msg is Message => !msg.isThinking));

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "❌ **Error**\n\nSorry, I encountered an unexpected error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to process request");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (example: { text: string; detailed: string }) => {
    setInput(example.detailed);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {messages.length === 1 && (
              <div className="mb-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/30 mb-4">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI-Powered Data Insights</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">What would you like to know?</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Choose from these popular queries or ask anything in your own words
                  </p>
                </div>

                <div className="max-w-3xl mx-auto">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {EXAMPLE_QUERIES.map((example, index) => {
                      const Icon = example.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 hover:shadow-sm"
                          onClick={() => handleExampleClick(example)}
                        >
                          <Icon className="h-3 w-3 mr-1.5 text-muted-foreground" />
                          <span>{example.text}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {messages
              .filter((message) => debugMode || message.role !== "assistant-debug")
              .map((message) => (
                <div key={message.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {message.role === "user" ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="prose prose-sm max-w-none">
                      {message.isThinking ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                          <span className="text-sm">{message.content}</span>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed">
                          <MarkdownPreview
                            content={message.content}
                            className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-li:text-foreground prose-blockquote:text-muted-foreground prose-a:text-primary"
                            hideAnchors={true}
                            fontSize="text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {message.queryExecuted && (message.role === "assistant-debug" || debugMode) && (
                      <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-muted/50">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Code className="h-3 w-3" />
                          SQL Query Executed
                        </div>
                        <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap border">
                          {message.queryExecuted}
                        </pre>
                        {message.queryResults && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">
                              Found{" "}
                              {Array.isArray(message.queryResults)
                                ? message.queryResults.length
                                : 1}{" "}
                              result(s)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <span className="text-sm">Processing your request...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your learning data..."
                disabled={isLoading}
                className="pr-12 bg-background border border-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 resize-none rounded-xl transition-all duration-200"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 mx-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Model:</span>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={modelsLoading || isLoading}
                >
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue>
                      {availableModels.find((m) => m.name === selectedModel)?.displayName ||
                        (modelsLoading ? "Loading..." : "Select model")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-xs">{model.displayName}</span>
                          {model.description && (
                            <span className="text-xs text-muted-foreground max-w-80 break-words whitespace-pre-line">
                              {model.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> to
              send •{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Shift + Enter</kbd> for
              new line
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Debug:</span>
              <Select
                value={debugMode ? "on" : "off"}
                onValueChange={(value) => setDebugMode(value === "on")}
              >
                <SelectTrigger className="h-6 text-xs">
                  <div className="flex items-center gap-1">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">
                    <div className="flex items-center gap-2">
                      <Bug className="h-3 w-3 text-muted-foreground" />
                      <span>Off</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="on">
                    <div className="flex items-center gap-2">
                      <Bug className="h-3 w-3 text-orange-500" />
                      <span>On</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
