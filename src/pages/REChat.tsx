import { useEffect, useState, useRef } from "react";
import {
  Send, Bot, User, Sparkles, Loader2, Copy, RefreshCw,
  MessageSquare, TrendingUp, MapPin, DollarSign, Zap,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { call } from "@/lib/api";

type Message = { role: "user" | "assistant"; text: string; ts: number };

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "Market brief", prompt: "Give me a 3-bullet Dubai RE market brief for this week — key stats, one opportunity, one risk." },
  { icon: MessageSquare, label: "WhatsApp opener", prompt: "Write a WhatsApp opener for an NRI investor asking about Dubai Marina 2BR under AED 2M. Warm but direct." },
  { icon: MapPin, label: "Area comparison", prompt: "Compare Dubai Marina vs Business Bay for a first-time investor buying AED 1.5M. Which is better and why?" },
  { icon: DollarSign, label: "ROI calculator", prompt: "Explain the ROI on a AED 1.2M JVC 1BR — rental yield, expected appreciation, break-even years." },
  { icon: Zap, label: "Objection handling", prompt: "Lead says 'I'm just browsing, not ready to buy this year.' Give me 3 response options — soft, medium, direct." },
  { icon: Sparkles, label: "Social caption", prompt: "Write an Instagram caption for a new Palm Jumeirah villa listing at AED 25M. Aspirational tone, emojis, 5 hashtags." },
];

export default function REChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi — I'm Proxim, your Dubai RE copilot. Ask me for market briefs, message drafts, objection handlers, ROI breakdowns, or anything you'd normally Google. What are you working on today?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const userMsg: Message = { role: "user", text: trimmed, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true); setError(null);
    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const result = await call<{ reply: string }>("re.chat.send", {
        message: trimmed,
        history,
      });
      setMessages((m) => [...m, { role: "assistant", text: result.reply || "(no reply)", ts: Date.now() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed. Check Gemini key in Integrations.");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([{
      role: "assistant",
      text: "Fresh start. What's on your plate?",
      ts: Date.now(),
    }]);
  }

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="page-title text-2xl flex items-center gap-3">
            <Bot size={24} className="text-primary" />
            AI Copilot
          </h1>
          <p className="text-white/50 text-sm mt-1">Your Dubai RE assistant — market intel, drafts, and instant answers</p>
        </div>
        <button onClick={reset} className="btn-secondary text-xs flex items-center gap-2">
          <RefreshCw size={12} /> New chat
        </button>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => send(qp.prompt)}
              className="glass p-3 rounded-xl border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-left flex items-start gap-2.5 group"
            >
              <qp.icon size={13} className="text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">{qp.label}</div>
                <div className="text-[10px] text-white/40 line-clamp-2 mt-0.5">{qp.prompt}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {sending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl glass flex items-center justify-center shrink-0">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Loader2 size={12} className="animate-spin" />
                Thinking…
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="text-xs text-danger p-3 bg-danger/10 border border-danger/25 rounded-lg">{error}</div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0">
        <GlassCard className="p-3">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about the Dubai market, draft a message, or get an ROI breakdown…"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-white/30 py-2 leading-relaxed min-h-[24px] max-h-[120px]"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              className="btn-primary flex items-center gap-2 text-xs shrink-0"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send
            </button>
          </div>
          <div className="text-[10px] text-white/25 mt-2 px-1">
            Shift + Enter for newline · Powered by Gemini 2.5 Flash
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-xl glass flex items-center justify-center shrink-0 ${isUser ? "text-white/60" : "text-primary"}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? "flex justify-end" : ""}`}>
        <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary/15 border border-primary/25 text-white"
            : "bg-white/[0.03] border border-white/[0.08] text-white/85"
        }`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
          {!isUser && (
            <button
              onClick={() => navigator.clipboard.writeText(message.text)}
              className="text-[10px] text-white/30 hover:text-white/70 transition-colors mt-2 flex items-center gap-1"
            >
              <Copy size={9} /> Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
