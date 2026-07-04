import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Send, MessageSquare, TrendingUp, Zap, AlertCircle,
  ArrowRight, Target, Bot, Activity, RefreshCw, ChevronRight,
  DollarSign, Clock,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type AnalyticsSummary = {
  totals: { campaigns: number; leads: number; sent: number; delivered: number; bounced: number; clicked: number; replied: number };
};

type ActivityEntry = {
  id: string;
  agent_id: string | null;
  category: string;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type Agent = { id: string; name: string; last_heartbeat: string | null; status: "online" | "idle" | "offline" };
type ConfigStatus = Record<string, { configured: boolean }>;

const MARKET_PULSE = [
  { value: "AED 760B+", label: "Dubai transactions (2025)", delta: "+30.6% YoY" },
  { value: "90%+", label: "RE comms via WhatsApp", delta: "25–35% conversion" },
  { value: "60s", label: "Target response time", delta: "vs 4h+ industry avg" },
  { value: "17%", label: "PropTech CAGR to 2030", delta: "AED 2.24B → 5.69B" },
];

const CAT_COLOR: Record<string, string> = {
  research: "text-primary",
  email: "text-blue-400",
  task: "text-purple",
  decision: "text-amber",
  error: "text-danger",
  system: "text-white/40",
  content: "text-success",
};

export default function RECommandCenter() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  async function load() {
    try {
      const [a, act, ag, cfg] = await Promise.all([
        call<AnalyticsSummary>("outreach.analytics.summary").catch(() => null),
        call<ActivityEntry[]>("activity.list").catch(() => []),
        call<Agent[]>("agent.list").catch(() => []),
        call<ConfigStatus>("config.status").catch(() => null),
      ]);
      setAnalytics(a);
      setActivity(act.slice(0, 8));
      setAgents(ag);
      setConfig(cfg);
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const totals = analytics?.totals;
  const missingKeys = config ? ["gemini", "apify", "agentmail"].filter(k => !config[k]?.configured) : [];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/40 text-sm font-semibold mb-1 tracking-wide">{greeting}</div>
          <h1 className="font-display font-black text-3xl tracking-wide text-white">Command Center</h1>
          <p className="text-white/50 mt-1 text-sm">Your AI real estate operating system · Dubai, UAE</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); void load(); }}
          className="btn-secondary flex items-center gap-2 text-xs"
          disabled={refreshing}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Setup banner */}
      {loaded && missingKeys.length > 0 && (
        <GlassCard className="p-4 border-amber/30 bg-amber/5">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-amber shrink-0" />
            <span className="text-sm text-amber">
              Setup required: configure <strong>{missingKeys.join(", ")}</strong> in{" "}
              <Link to="/integrations" className="underline hover:text-white">Integrations</Link> to activate all systems.
            </span>
          </div>
        </GlassCard>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        <KPI icon={Users} label="Total Leads" value={totals?.leads ?? 0} color="text-primary" to="/leads" />
        <KPI icon={Send} label="Emails Sent" value={totals?.sent ?? 0} color="text-blue-400" to="/campaigns" />
        <KPI icon={MessageSquare} label="Replies" value={totals?.replied ?? 0} color="text-success" to="/inbox" />
        <KPI icon={Target} label="Campaigns" value={totals?.campaigns ?? 0} color="text-purple" to="/campaigns" />
        <KPI icon={TrendingUp} label="Click-throughs" value={totals?.clicked ?? 0} color="text-accent" to="/analytics" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Activity Feed */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm tracking-widest uppercase text-white/60">Live Activity</h2>
            <Link to="/analytics" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          <GlassCard className="p-0 overflow-hidden">
            {!loaded && (
              <div className="p-6 text-center text-white/30 text-sm">Loading…</div>
            )}
            {loaded && activity.length === 0 && (
              <div className="p-6 text-center">
                <Activity size={24} className="mx-auto mb-2 text-white/20" />
                <p className="text-white/40 text-sm">No activity yet. Start a campaign to see your AI working.</p>
              </div>
            )}
            {activity.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 px-5 py-3.5 ${i < activity.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${CAT_COLOR[a.category] ? "bg-current" : "bg-white/20"} ${CAT_COLOR[a.category] ?? "text-white/20"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 leading-snug">{a.summary}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${CAT_COLOR[a.category] ?? "text-white/30"}`}>{a.category}</span>
                    <span className="text-[10px] text-white/25">{timeAgo(a.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            <QuickAction to="/campaigns" icon={Send} label="New Campaign" sub="Scrape & outreach" color="primary" />
            <QuickAction to="/leads" icon={Users} label="Score Leads" sub="Hot / Warm / Cold" color="purple" />
            <QuickAction to="/pipeline" icon={Zap} label="View Pipeline" sub="Active deals" color="accent" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI Agents */}
          <div>
            <h2 className="font-display font-bold text-sm tracking-widest uppercase text-white/60 mb-3">AI Agents</h2>
            <GlassCard className="p-4 space-y-3">
              {agents.length === 0 ? (
                <div className="text-center py-3">
                  <Bot size={20} className="mx-auto mb-2 text-white/20" />
                  <p className="text-xs text-white/40 mb-2">No agents registered</p>
                  <Link to="/integrations" className="text-xs text-primary hover:underline">Register an agent →</Link>
                </div>
              ) : (
                agents.map((ag) => (
                  <AgentRow key={ag.id} agent={ag} />
                ))
              )}

              {/* Proxim AI agents (conceptual display) */}
              {agents.length === 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
                  <ConceptAgent name="WhatsApp Qualifier" status="ready" sub="Responds in 60s" />
                  <ConceptAgent name="Outbound SDR" status="ready" sub="Scrapes + emails" />
                  <ConceptAgent name="Nurture Agent" status="ready" sub="90-day follow-up" />
                </div>
              )}
            </GlassCard>
          </div>

          {/* Market Pulse */}
          <div>
            <h2 className="font-display font-bold text-sm tracking-widest uppercase text-white/60 mb-3">UAE Market Pulse</h2>
            <GlassCard className="p-4 space-y-3">
              {MARKET_PULSE.map((m) => (
                <div key={m.label} className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-display font-bold text-primary leading-none">{m.value}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{m.label}</div>
                  </div>
                  <div className="text-[10px] text-success font-bold text-right mt-0.5">{m.delta}</div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/[0.06]">
                <Link to="/market" className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                  Full market intelligence <ArrowRight size={11} />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, color, to }: { icon: React.ElementType<any>; label: string; value: number; color: string; to: string }) {
  return (
    <Link to={to}>
      <GlassCard className="p-4 hover:border-white/15 transition-all cursor-pointer group" hover>
        <Icon size={16} className={`mb-2.5 ${color}`} />
        <div className={`text-2xl font-display font-bold ${color} group-hover:opacity-90`}>
          <AnimatedNumber value={value} />
        </div>
        <div className="text-xs text-white/40 mt-0.5 font-semibold">{label}</div>
      </GlassCard>
    </Link>
  );
}

function QuickAction({ to, icon: Icon, label, sub, color }: { to: string; icon: React.ElementType<any>; label: string; sub: string; color: "primary" | "purple" | "accent" }) {
  const colors = { primary: "border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary", purple: "border-purple/20 hover:border-purple/40 hover:bg-purple/5 text-purple", accent: "border-accent/20 hover:border-accent/40 hover:bg-accent/5 text-accent" };
  return (
    <Link to={to} className={`glass p-4 rounded-xl border transition-all flex items-start gap-3 group ${colors[color]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-white/40 mt-0.5">{sub}</div>
      </div>
    </Link>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const dotClass = agent.status === "online" ? "bg-success" : agent.status === "idle" ? "bg-amber" : "bg-white/20";
  const labelClass = agent.status === "online" ? "text-success" : agent.status === "idle" ? "text-amber" : "text-white/25";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
      <span className="text-sm font-semibold text-white/80 flex-1 truncate">{agent.name}</span>
      <span className={`text-[9px] uppercase font-bold tracking-wide ${labelClass}`}>{agent.status}</span>
      <span className="text-[9px] text-white/25">{timeAgo(agent.last_heartbeat)}</span>
    </div>
  );
}

function ConceptAgent({ name, status, sub }: { name: string; status: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2 h-2 rounded-full shrink-0 bg-white/15" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white/50">{name}</div>
        <div className="text-[10px] text-white/25">{sub}</div>
      </div>
      <span className="text-[9px] uppercase font-bold tracking-wide text-white/25">ready</span>
    </div>
  );
}
