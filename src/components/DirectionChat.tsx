import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatRoom {
  id: string;
  name: string;
  direction_id: string | null;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: { first_name: string; last_name: string };
}

export default function DirectionChat({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, { first_name: string; last_name: string }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    supabase.from("chat_rooms").select("*").order("created_at").then(({ data }) => {
      if (data) setRooms(data as ChatRoom[]);
    });
  }, [open]);

  useEffect(() => {
    if (!selectedRoom) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", selectedRoom.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) {
        setMessages(data as ChatMessage[]);
        // Fetch profiles
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", userIds);
          if (profs) {
            const map = new Map<string, { first_name: string; last_name: string }>();
            profs.forEach((p: any) => map.set(p.user_id, p));
            setProfiles(map);
          }
        }
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${selectedRoom.id}`,
      }, async (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        // Fetch profile if not cached
        if (!profiles.has(newMsg.user_id)) {
          const { data } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .eq("user_id", newMsg.user_id)
            .single();
          if (data) {
            setProfiles(prev => new Map(prev).set(data.user_id, data));
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      room_id: selectedRoom.id,
      user_id: userId,
      message: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  const getProfileName = (uid: string) => {
    const p = profiles.get(uid);
    if (!p) return "Пользователь";
    return `${p.first_name} ${p.last_name?.[0] || ""}.`.trim();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 z-50 rounded-full h-12 w-12 shadow-lg border-sun/30 bg-background hover:bg-sun/10"
        >
          <MessageCircle className="h-5 w-5 text-sun" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        {!selectedRoom ? (
          <>
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="font-display">Чаты по направлениям</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sun/10">
                      <MessageCircle className="h-4 w-4 text-sun" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{room.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { setSelectedRoom(null); setMessages([]); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-display text-sm font-bold truncate">{selectedRoom.name}</h3>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">Начните общение!</p>
              )}
              {messages.map(msg => {
                const isOwn = msg.user_id === userId;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isOwn ? 'bg-sun text-white' : 'bg-muted text-foreground'}`}>
                      {!isOwn && (
                        <p className="text-[10px] font-semibold mb-0.5 opacity-70">{getProfileName(msg.user_id)}</p>
                      )}
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Сообщение..."
                className="flex-1"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button variant="sun" size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
