import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  user_name: string;
  message_text: string;
  created_at: string;
}

interface ChatPanelProps {
  eventId: string;
}

export function ChatPanel({ eventId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventId) {
      fetchMessages();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`messages:${eventId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [eventId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!userName.trim() || !messageText.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          event_id: eventId,
          user_name: userName.trim(),
          message_text: messageText.trim(),
        });

      if (error) throw error;

      setMessageText("");
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
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
                    <span className="font-medium text-sm">{message.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{message.message_text}</p>
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
              disabled={!userName.trim() || sending}
            />
            <Button
              variant="hero"
              size="icon"
              onClick={sendMessage}
              disabled={!userName.trim() || !messageText.trim() || sending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
