import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Send,
  Kanban,
  BarChart3,
  Inbox,
  Globe,
  Settings,
  Code2,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { call } from "@/lib/api";

type Agent = {
  id: string;
  name: string;
  last_heartbeat: string | null;
  status: "online" | "idle" | "offline";
};

const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Lead Intelligence", icon: Users },
  { to: "/campaigns", label: "Outreach", icon: Send },
  { to: "/pipeline", label: "Deal Pipeline", icon: Kanban },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/market", label: "Market Intel", icon: Globe },
];

const SYS_NAV = [
  { to: "/integrations", label: "Integrations", icon: Code2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const DOT: Record<string, string> = {
  online: "bg-success shadow-[0_0_8px_#00e676]",
  idle: "bg-amber shadow-[0_0_6px_#f59e0b]",
  offline: "bg-white/20",
};

export default function RESidebar() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await call<Agent[]>("agent.list");
        setAgents(list.slice(0, 3));
      } catch {
        // silently skip if no agents registered
      }
    };
    void load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="w-[270px] shrink-0 border-r border-white/[0.06] px-4 py-7 flex flex-col gap-6 overflow-y-auto">
      {/* Logo */}
      <div className="px-2 mb-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-purple/30 border border-primary/30 flex items-center justify-center shadow-glow shrink-0">
            <span className="font-display font-black text-xs text-primary">P</span>
          </div>
          <div>
            <div className="font-display font-black tracking-[0.2em] text-sm text-white">PROXIM</div>
            <div className="text-[9px] tracking-[0.35em] text-white/40 uppercase font-semibold -mt-0.5">Real Estate OS</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 px-3 mb-1">Platform</p>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/25 shadow-[0_0_16px_rgba(0,191,255,0.1)]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]",
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* System nav */}
      <nav className="flex flex-col gap-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 px-3 mb-1">System</p>
        {SYS_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/25"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]",
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* AI Agents */}
      <div className="mt-auto">
        <div className="glass p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={13} className="text-primary" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">AI Agents</span>
          </div>
          {agents.length === 0 ? (
            <NavLink
              to="/integrations"
              className="text-xs text-white/30 hover:text-primary transition-colors"
            >
              No agents registered →
            </NavLink>
          ) : (
            <div className="space-y-2">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", DOT[a.status] ?? DOT.offline)} />
                  <span className="text-xs text-white/70 font-semibold truncate flex-1">{a.name}</span>
                  <span className={cn("text-[9px] uppercase font-bold tracking-wide", a.status === "online" ? "text-success" : a.status === "idle" ? "text-amber" : "text-white/25")}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market status */}
        <div className="mt-3 px-3">
          <div className="flex items-center gap-2">
            <span className="pulse-dot dot-green w-2 h-2" />
            <span className="text-[10px] text-white/40">Dubai market: live</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
