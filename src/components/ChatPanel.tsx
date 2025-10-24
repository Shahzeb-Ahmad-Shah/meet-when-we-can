import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  eventId: string;
}

export function ChatPanel({ eventId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState("");
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages from localStorage
    const loadMessages = () => {
      const storedMessages = localStorage.getItem(`chat_${eventId}`);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    };

    loadMessages();
    // Poll for new messages
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!userName.trim() || !messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userName: userName.trim(),
      text: messageText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMessage];
    localStorage.setItem(`chat_${eventId}`, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    setMessageText("");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="shadow-card border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Event Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-muted/50 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-sm">{message.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="space-y-2 pt-2 border-t">
          {!userName && (
            <Input
              placeholder="Enter your name first..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && userName.trim() && setUserName(userName)}
            />
          )}
          <div className="flex gap-2">
            <Input
              placeholder={userName ? "Type a message..." : "Enter your name first"}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={!userName.trim()}
            />
            <Button
              variant="hero"
              size="icon"
              onClick={sendMessage}
              disabled={!userName.trim() || !messageText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
