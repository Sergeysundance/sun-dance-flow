import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SupportThread {
  user_id: string;
  profile_name: string;
  last_message: string;
  last_at: string;
  unread_count: number;
}

interface SupportMessage {
  id: string;
  message: string;
  sender_role: string;
  read: boolean;
  created_at: string;
}

export default function SupportMessagesPage() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async () => {
    // Get all support messages grouped by user
    const { data: allMsgs } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!allMsgs || allMsgs.length === 0) { setThreads([]); return; }

    // Group by user_id
    const grouped: Record<string, any[]> = {};
    for (const m of allMsgs) {
      if (!grouped[m.user_id]) grouped[m.user_id] = [];
      grouped[m.user_id].push(m);
    }

    // Fetch profiles for user names
    const userIds = Object.keys(grouped);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, `${p.last_name} ${p.first_name}`.trim() || "Без имени"]));

    const threadList: SupportThread[] = userIds.map(uid => {
      const msgs = grouped[uid];
      const unread = msgs.filter((m: any) => m.sender_role === "user" && !m.read).length;
      return {
        user_id: uid,
        profile_name: profileMap.get(uid) || "Пользователь",
        last_message: msgs[0].message,
        last_at: msgs[0].created_at,
        unread_count: unread,
      };
    });

    // Sort: unread first, then by last message date
    threadList.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      return new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
    });

    setThreads(threadList);
  };

  const fetchMessages = async (uid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    setMessages((data || []) as SupportMessage[]);

    // Mark user messages as read
    const unreadIds = (data || []).filter((m: any) => m.sender_role === "user" && !m.read).map((m: any) => m.id);
    if (unreadIds.length > 0) {
      for (const id of unreadIds) {
        await supabase.from("support_messages").update({ read: true }).eq("id", id);
      }
      fetchThreads();
    }
  };

  useEffect(() => {
    fetchThreads();

    const channel = supabase
      .channel("admin-support")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
        fetchThreads();
        if (selectedUserId) fetchMessages(selectedUserId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedUserId) fetchMessages(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReply = async () => {
    if (!reply.trim() || !selectedUserId || sending) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: selectedUserId,
      message: reply.trim(),
      sender_role: "admin",
      subject: "Ответ поддержки",
    });
    if (error) {
      toast.error("Не удалось отправить ответ");
    } else {
      setReply("");
      fetchMessages(selectedUserId);
      fetchThreads();
    }
    setSending(false);
  };

  const totalUnread = threads.reduce((s, t) => s + t.unread_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-admin-foreground">Обращения в поддержку</h2>
        {totalUnread > 0 && (
          <Badge variant="destructive" className="text-xs">{totalUnread} новых</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500 }}>
        {/* Thread list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Диалоги</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {threads.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Нет обращений</p>
            ) : (
              <div className="divide-y max-h-[450px] overflow-y-auto">
                {threads.map(t => (
                  <button
                    key={t.user_id}
                    onClick={() => setSelectedUserId(t.user_id)}
                    className={`w-full text-left px-4 py-3 hover:bg-admin-hover transition-colors ${
                      selectedUserId === t.user_id ? "bg-admin-active" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 flex-shrink-0 text-admin-muted" />
                        <span className="text-sm font-medium truncate text-admin-foreground">{t.profile_name}</span>
                      </div>
                      {t.unread_count > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-admin-muted truncate mt-1">{t.last_message}</p>
                    <span className="text-[10px] text-admin-muted">
                      {new Date(t.last_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 flex flex-col h-[500px]">
            {!selectedUserId ? (
              <div className="flex-1 flex items-center justify-center text-admin-muted text-sm">
                <div className="text-center">
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Выберите диалог</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-medium mb-3 pb-2 border-b text-admin-foreground">
                  {threads.find(t => t.user_id === selectedUserId)?.profile_name}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.sender_role === "admin"
                          ? "bg-admin-accent text-admin-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p>{m.message}</p>
                        <span className="text-[10px] block mt-1 opacity-60">
                          {m.sender_role === "admin" ? "Администратор" : "Пользователь"} · {new Date(m.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ответить..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    disabled={sending}
                  />
                  <Button size="icon" onClick={handleReply} disabled={!reply.trim() || sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
