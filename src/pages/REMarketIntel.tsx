import { useState } from "react";
import {
  TrendingUp, DollarSign, Users, MessageSquare, Zap,
  MapPin, Globe, ArrowUpRight, Clock, Target, Star,
  Building2, Home, BarChart3,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";

type Segment = {
  id: string;
  name: string;
  share: string;
  channel: string;
  avgTicket: string;
  painPoint: string;
  aiOpportunity: string;
  color: string;
};

type Area = {
  name: string;
  avgPsf: string;
  trend: string;
  profile: string;
  demand: "high" | "medium" | "hot";
};

const SEGMENTS: Segment[] = [
  {
    id: "nri",
    name: "NRI / Diaspora Investors",
    share: "35–40%",
    channel: "WhatsApp · Instagram",
    avgTicket: "AED 800K–2.5M",
    painPoint: "Trust deficit with remote buying; language barrier",
    aiOpportunity: "Arabic/Hindi WhatsApp follow-up; virtual tour booking bot",
    color: "primary",
  },
  {
    id: "hni",
    name: "UAE HNI Residents",
    share: "25–30%",
    channel: "WhatsApp · Referral",
    avgTicket: "AED 3M–20M+",
    painPoint: "4+ hour portal response time; generic outreach",
    aiOpportunity: "60-second AI response; hyper-personalised offers",
    color: "purple",
  },
  {
    id: "sme",
    name: "SME / Commercial Buyers",
    share: "15–20%",
    channel: "Email · LinkedIn",
    avgTicket: "AED 1.5M–8M",
    painPoint: "Long ROI calculation cycles; scattered data",
    aiOpportunity: "Instant ROI report generator; rental yield calculator",
    color: "accent",
  },
  {
    id: "enduser",
    name: "End-User Families",
    share: "15–20%",
    channel: "WhatsApp · Portals",
    avgTicket: "AED 600K–2M",
    painPoint: "Overwhelmed by choice; slow mortgage pre-approval",
    aiOpportunity: "AI shortlist engine; mortgage partner intro flow",
    color: "amber",
  },
];

const AREAS: Area[] = [
  { name: "Dubai Marina", avgPsf: "AED 1,850–2,400", trend: "+18% YoY", profile: "Luxury. Expats, HNIs, short-term rental investors.", demand: "hot" },
  { name: "Downtown Dubai", avgPsf: "AED 2,200–3,100", trend: "+22% YoY", profile: "Ultra-luxury. Global HNIs, Burj Khalifa premium.", demand: "hot" },
  { name: "JVC", avgPsf: "AED 900–1,300", trend: "+31% YoY", profile: "Affordable. NRI investors, first-time buyers. Highest ROI yield.", demand: "hot" },
  { name: "Business Bay", avgPsf: "AED 1,400–2,000", trend: "+15% YoY", profile: "Mixed. Commercial + residential. Strong rental demand.", demand: "high" },
  { name: "Palm Jumeirah", avgPsf: "AED 3,500–6,000+", trend: "+28% YoY", profile: "Ultra-luxury. Villas, penthouses. Russian & European HNIs.", demand: "hot" },
  { name: "JBR", avgPsf: "AED 1,600–2,200", trend: "+12% YoY", profile: "Beachfront. Short-term rental specialists, holiday homes.", demand: "high" },
  { name: "Sharjah / Ajman", avgPsf: "AED 400–700", trend: "+8% YoY", profile: "Budget. Indian & Pakistani NRIs. Underserved by tech.", demand: "medium" },
];

const DEMAND_STYLE = {
  hot: "bg-red-500/15 border-red-500/35 text-red-300",
  high: "bg-amber/15 border-amber/35 text-amber",
  medium: "bg-white/8 border-white/20 text-white/50",
};

const WHATSAPP_STATS = [
  { stat: "90%+", label: "UAE RE professionals use WhatsApp as primary channel" },
  { stat: "25–35%", label: "WhatsApp conversion rate vs 2–4% email average" },
  { stat: "60s", label: "Target first response time (industry avg: 4+ hours)" },
  { stat: "74%", label: "UAE smartphone penetration — highest globally" },
  { stat: "68%", label: "Leads that chose broker based on first response speed" },
  { stat: "3.2×", label: "Higher close rate when AI responds within 5 minutes" },
];

const MARKET_TRENDS = [
  {
    title: "AED 760B+ transactions in 2025",
    sub: "+30.6% YoY. Dubai ranks #3 global luxury RE market.",
    icon: DollarSign,
    color: "text-primary",
  },
  {
    title: "PropTech CAGR: 17% to 2030",
    sub: "UAE PropTech market AED 2.24B → AED 5.69B by 2030.",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    title: "15M+ total population. 89% expat.",
    sub: "Largest expat RE buyer base in the world. Multi-language AI critical.",
    icon: Users,
    color: "text-purple",
  },
  {
    title: "60%+ market underserved in Arabic",
    sub: "Arabic-speaking agents close 2.4× more leads. AI fills the gap.",
    icon: Globe,
    color: "text-accent",
  },
];

const PORTAL_STATS = [
  { name: "Bayut.com", share: "41%", users: "4.2M/mo", note: "Dominant. API available." },
  { name: "PropertyFinder", share: "35%", users: "3.1M/mo", note: "Strong analytics layer." },
  { name: "Dubizzle", share: "18%", users: "2.4M/mo", note: "Budget segment focus." },
  { name: "Other / Direct", share: "6%", users: "—", note: "WhatsApp referrals, direct." },
];

export default function REMarketIntel() {
  const [segTab, setSegTab] = useState<string>("nri");
  const activeSeg = SEGMENTS.find((s) => s.id === segTab) ?? SEGMENTS[0];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl">UAE Market Intelligence</h1>
        <p className="text-white/50 text-sm mt-1">Real-time intelligence on the Dubai & UAE real estate landscape</p>
      </div>

      {/* Top market trends */}
      <div className="grid grid-cols-2 gap-4">
        {MARKET_TRENDS.map((t) => (
          <GlassCard key={t.title} className="p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center shrink-0 ${t.color}`}>
              <t.icon size={18} />
            </div>
            <div>
              <p className={`font-display font-bold text-sm ${t.color} mb-0.5`}>{t.title}</p>
              <p className="text-xs text-white/50 leading-relaxed">{t.sub}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* WhatsApp dominance */}
        <div className="col-span-2 space-y-4">
          <SectionHeader title="WhatsApp — The Real Estate Channel" icon={MessageSquare} />
          <div className="grid grid-cols-3 gap-3">
            {WHATSAPP_STATS.map((s) => (
              <GlassCard key={s.stat} className="p-4 text-center">
                <div className="text-2xl font-display font-bold text-success leading-none">{s.stat}</div>
                <div className="text-[10px] text-white/40 mt-1.5 leading-snug">{s.label}</div>
              </GlassCard>
            ))}
          </div>

          {/* Area guide */}
          <SectionHeader title="Dubai Area Intelligence" icon={MapPin} />
          <div className="space-y-2">
            {AREAS.map((area) => (
              <GlassCard key={area.name} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm text-white">{area.name}</span>
                      <span className={`tag text-[9px] ${DEMAND_STYLE[area.demand]}`}>{area.demand}</span>
                    </div>
                    <p className="text-xs text-white/45 leading-relaxed">{area.profile}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">{area.avgPsf}</div>
                    <div className="flex items-center gap-1 text-xs text-success mt-0.5 justify-end">
                      <ArrowUpRight size={11} />{area.trend}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right: Segments + portals */}
        <div className="space-y-4">
          <SectionHeader title="Buyer Segments" icon={Target} />
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex border-b border-white/[0.06]">
              {SEGMENTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSegTab(s.id)}
                  className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                    segTab === s.id ? `text-${s.color} bg-${s.color}/5` : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {s.name.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Market Share</p>
                <p className={`text-xl font-display font-bold text-${activeSeg.color}`}>{activeSeg.share}</p>
              </div>
              <InfoRow label="Avg Ticket" value={activeSeg.avgTicket} />
              <InfoRow label="Channel" value={activeSeg.channel} />
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Pain Point</p>
                <p className="text-xs text-white/60 leading-relaxed">{activeSeg.painPoint}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">AI Opportunity</p>
                <p className="text-xs text-primary/80 leading-relaxed">{activeSeg.aiOpportunity}</p>
              </div>
            </div>
          </GlassCard>

          {/* Portal breakdown */}
          <SectionHeader title="Portal Landscape" icon={BarChart3} />
          <GlassCard className="p-4 space-y-3">
            {PORTAL_STATS.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className="text-xs font-bold text-primary">{p.share}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary/60 rounded-full"
                    style={{ width: p.share }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/30">
                  <span>{p.users}</span>
                  <span>{p.note}</span>
                </div>
              </div>
            ))}
          </GlassCard>

          {/* AI Impact card */}
          <GlassCard className="p-4 border-primary/20 bg-primary/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-primary" />
              <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">Proxim AI Edge</span>
            </div>
            <div className="space-y-2">
              {[
                "60-second WhatsApp response vs 4hr+ industry avg",
                "Arabic + English outreach from one platform",
                "Automatic lead scoring on 12 signal points",
                "Brokerage CRM synced to campaign pipeline",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-primary shrink-0 mt-0.5">▸</span>
                  {point}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType<any> }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-white/40" />
      <h2 className="font-display font-bold text-xs tracking-widest uppercase text-white/50">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-white/70">{value}</span>
    </div>
  );
}
