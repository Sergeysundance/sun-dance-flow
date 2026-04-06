import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SupportMessage {
  id: string;
  message: string;
  sender_role: string;
  subject: string;
  read: boolean;
  created_at: string;
}

export default function SupportChat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    const msgs = (data || []) as SupportMessage[];
    setMessages(msgs);
    setUnreadSupportCount(msgs.filter(m => m.sender_role === "admin" && !m.read).length);
  };

  useEffect(() => {
    if (!userId) return;
    fetchMessages();

    const channel = supabase
      .channel("support-messages-" + userId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_messages",
        filter: `user_id=eq.${userId}`,
      }, () => fetchMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark admin replies as read when viewing
  useEffect(() => {
    const unreadAdminIds = messages.filter(m => m.sender_role === "admin" && !m.read).map(m => m.id);
    if (unreadAdminIds.length > 0) {
      Promise.all(
        unreadAdminIds.map(id => supabase.from("support_messages").update({ read: true }).eq("id", id))
      ).then(() => {
        setMessages(prev => prev.map(m => unreadAdminIds.includes(m.id) ? { ...m, read: true } : m));
        setUnreadSupportCount(0);
      });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: newMessage.trim(),
      sender_role: "user",
      subject: "Обращение в поддержку",
    });
    if (error) {
      toast.error("Не удалось отправить сообщение");
    } else {
      setNewMessage("");
      fetchMessages();
    }
    setSending(false);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-5 w-5" />
          Чат с поддержкой
          {unreadSupportCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadSupportCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[300px]">
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Напишите сообщение, и администратор ответит вам здесь
              </p>
            ) : (
              messages.map(m => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.sender_role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p>{m.message}</p>
                    <span className={`text-[10px] block mt-1 ${m.sender_role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Напишите сообщение..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending}
            />
            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
