import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Send, Users, MessageSquare, TrendingUp, Target,
  MapPin, Clock, ChevronRight, Loader2, X, Sparkles,
  CheckCircle, AlertCircle, Search, RefreshCw,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  query: string;
  description?: string;
  structured_query: { location: string; searchTerms: string[]; maxResults: number } | null;
  status: "draft" | "searching" | "ready" | "sending" | "completed" | "failed";
  total_leads_found: number;
  leads_imported: number;
  emails_generated: number;
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  emails_clicked: number;
  emails_replied: number;
  created_at: string;
  updated_at: string;
};

type IcpTemplate = {
  id: string;
  name: string;
  description: string;
  searchTerms: string[];
  location: string;
  maxResults: number;
};

const STATUS_STYLE: Record<Campaign["status"], { tag: string; label: string }> = {
  draft: { tag: "bg-white/8 border-white/20 text-white/50", label: "Draft" },
  searching: { tag: "bg-primary/15 border-primary/35 text-primary", label: "Scraping…" },
  ready: { tag: "bg-accent/15 border-accent/35 text-accent", label: "Ready" },
  sending: { tag: "bg-purple/15 border-purple/35 text-purple", label: "Sending" },
  completed: { tag: "bg-success/15 border-success/35 text-success", label: "Completed" },
  failed: { tag: "bg-danger/15 border-danger/35 text-danger", label: "Failed" },
};

const STATUS_FILTERS = ["all", "ready", "sending", "completed", "searching", "draft", "failed"] as const;

export default function RECampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<IcpTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [camps, tmpls] = await Promise.all([
        call<Campaign[]>("outreach.campaign.list").catch(() => []),
        call<IcpTemplate[]>("re.icp.templates").catch(() => []),
      ]);
      setCampaigns(camps);
      setTemplates(tmpls);
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    let list = campaigns;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.query ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [campaigns, statusFilter, search]);

  const totals = useMemo(() => ({
    campaigns: campaigns.length,
    leads: campaigns.reduce((s, c) => s + c.leads_imported, 0),
    sent: campaigns.reduce((s, c) => s + c.emails_sent, 0),
    replied: campaigns.reduce((s, c) => s + c.emails_replied, 0),
  }), [campaigns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-2xl">Outreach Campaigns</h1>
          <p className="text-white/50 text-sm mt-1">Scrape, enrich, and email Dubai RE brokerages</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); void load(); }}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowWizard(true)} className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={13} /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Campaigns" value={totals.campaigns} color="text-primary" icon={Target} />
        <StatCard label="Total Leads" value={totals.leads} color="text-white" icon={Users} />
        <StatCard label="Emails Sent" value={totals.sent} color="text-blue-400" icon={Send} />
        <StatCard label="Replies" value={totals.replied} color="text-success" icon={MessageSquare} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="input-field pl-9 text-sm w-56"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                statusFilter === s
                  ? "bg-primary/15 border-primary/35 text-primary"
                  : "bg-transparent border-white/10 text-white/40 hover:text-white/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/30 ml-auto">{filtered.length} campaigns</span>
      </div>

      {/* Empty state */}
      {loaded && campaigns.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Target size={40} className="mx-auto mb-3 text-white/15" />
          <p className="font-semibold text-white/60 mb-1">No campaigns yet</p>
          <p className="text-white/40 text-sm mb-4">Use an ICP template to scrape Dubai RE leads in minutes.</p>
          <button onClick={() => setShowWizard(true)} className="btn-primary text-sm flex items-center gap-2 mx-auto">
            <Plus size={14} /> Create First Campaign
          </button>
        </GlassCard>
      )}

      {!loaded && (
        <GlassCard className="p-8 text-center">
          <div className="text-white/30 text-sm">Loading campaigns…</div>
        </GlassCard>
      )}

      {/* Campaign list */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} to={`/campaigns/${c.id}`}>
              <GlassCard className="p-0 overflow-hidden hover:border-white/15 transition-colors" hover>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Status indicator */}
                  <div className="shrink-0">
                    {c.status === "searching" ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : c.status === "completed" ? (
                      <CheckCircle size={16} className="text-success" />
                    ) : c.status === "failed" ? (
                      <AlertCircle size={16} className="text-danger" />
                    ) : (
                      <Target size={16} className="text-white/30" />
                    )}
                  </div>

                  {/* Name + location */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-white">{c.name}</span>
                      <span className={`tag text-[9px] ${STATUS_STYLE[c.status].tag}`}>
                        {STATUS_STYLE[c.status].label}
                      </span>
                    </div>
                    {c.structured_query && (
                      <div className="flex items-center gap-1 text-xs text-white/35 mt-0.5">
                        <MapPin size={10} />
                        <span>{c.structured_query.location ?? ""}</span>
                        {Array.isArray(c.structured_query.searchTerms) && c.structured_query.searchTerms.length > 0 && (
                          <>
                            <span className="text-white/20">·</span>
                            <span>{c.structured_query.searchTerms.slice(0, 2).join(", ")}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-6 text-xs shrink-0">
                    <Metric icon={Users} value={c.leads_imported} label="leads" color="text-white/60" />
                    <Metric icon={Send} value={c.emails_sent} label="sent" color="text-blue-400" />
                    <Metric icon={MessageSquare} value={c.emails_replied} label="replied" color="text-success" />
                    <Metric icon={TrendingUp} value={c.emails_clicked} label="clicked" color="text-accent" />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-white/25 hidden sm:block">
                      <Clock size={9} className="inline mr-1" />{timeAgo(c.updated_at)}
                    </span>
                    <ChevronRight size={14} className="text-white/20" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {/* New Campaign Wizard */}
      {showWizard && (
        <CampaignWizard
          templates={templates}
          onClose={() => setShowWizard(false)}
          onCreated={(id) => { setShowWizard(false); void load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType<any> }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-white/40 font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-display font-bold ${color}`}>
        <AnimatedNumber value={value} />
      </div>
    </GlassCard>
  );
}

function Metric({ icon: Icon, value, label, color }: { icon: React.ElementType<any>; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} className={color} />
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-white/25">{label}</span>
    </div>
  );
}

function CampaignWizard({
  templates,
  onClose,
  onCreated,
}: {
  templates: IcpTemplate[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"template" | "customize" | "launching">("template");
  const [selected, setSelected] = useState<IcpTemplate | null>(null);
  const [name, setName] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const fallbackTemplates: IcpTemplate[] = [
    {
      id: "dubai-marina-luxury",
      name: "Dubai Marina — Luxury Brokers",
      description: "High-end brokerages in Dubai Marina, JBR, Palm Jumeirah. Target luxury portfolio managers.",
      searchTerms: ["real estate agency", "property broker", "luxury property"],
      location: "Dubai Marina, Dubai, UAE",
      maxResults: 50,
    },
    {
      id: "jvc-affordable",
      name: "JVC / JVT — Affordable Specialists",
      description: "Mid-market brokers in Jumeirah Village Circle and Triangle. Strong investor pipeline.",
      searchTerms: ["real estate agency", "property management", "investment property"],
      location: "Jumeirah Village Circle, Dubai, UAE",
      maxResults: 75,
    },
    {
      id: "downtown-commercial",
      name: "Downtown — Commercial & Retail",
      description: "Commercial property agents near DIFC, Downtown, Business Bay.",
      searchTerms: ["commercial real estate", "office space", "property consultant"],
      location: "Downtown Dubai, UAE",
      maxResults: 50,
    },
    {
      id: "sharjah-ajman",
      name: "Sharjah & Ajman — NRI Focus",
      description: "Brokers serving NRI buyers. High WhatsApp engagement, underserved by tech.",
      searchTerms: ["real estate office", "property agency", "NRI property"],
      location: "Sharjah, UAE",
      maxResults: 100,
    },
  ];

  const list = templates.length > 0 ? templates : fallbackTemplates;

  async function launch() {
    if (!selected || !name.trim()) return;
    setStep("launching");
    setError(null);
    try {
      const created = await call<{ id: string }>("outreach.campaign.create", {
        name: name.trim(),
        query: `${selected.searchTerms[0]} in ${selected.location}`,
        structured_query: {
          location: selected.location,
          searchTerms: selected.searchTerms,
          maxResults,
        },
        description: selected.description,
      });
      // Kick off the Apify scrape (async — detail page will poll for sync)
      await call("outreach.campaign.run", { id: created.id }).catch(() => {});
      onCreated(created.id);
      navigate(`/campaigns/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create campaign. Check Apify key is configured in Integrations.");
      setStep("customize");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="font-display font-bold text-base text-white">
              {step === "template" ? "Choose ICP Template" : step === "customize" ? "Customize Campaign" : "Launching…"}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {step === "template" ? "Select a pre-built Dubai RE target segment" : "Review settings before launch"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === "template" && (
            <div className="grid grid-cols-2 gap-3">
              {list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setName(t.name);
                    setMaxResults(t.maxResults);
                    setStep("customize");
                  }}
                  className="text-left p-4 rounded-xl border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="font-bold text-sm text-white group-hover:text-primary transition-colors mb-1">{t.name}</div>
                  <p className="text-xs text-white/45 leading-relaxed">{t.description}</p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <MapPin size={9} className="text-white/30" />
                    <span className="text-[10px] text-white/30">{t.location}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {(step === "customize" || step === "launching") && selected && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Campaign Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  disabled={step === "launching"}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">
                  Max Leads to Scrape
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={10}
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    disabled={step === "launching"}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-bold text-primary w-10 text-right">{maxResults}</span>
                </div>
              </div>

              <div className="glass p-4 rounded-xl space-y-2">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Target Details</p>
                <div className="flex items-start gap-2 text-xs">
                  <MapPin size={11} className="text-white/30 mt-0.5 shrink-0" />
                  <span className="text-white/60">{selected.location}</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Search size={11} className="text-white/30 mt-0.5 shrink-0" />
                  <span className="text-white/60">{Array.isArray(selected.searchTerms) ? selected.searchTerms.join(" · ") : ""}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-lg text-xs text-danger">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("template")}
                  disabled={step === "launching"}
                  className="btn-secondary text-sm"
                >
                  Back
                </button>
                <button
                  onClick={launch}
                  disabled={step === "launching" || !name.trim()}
                  className="btn-primary text-sm flex items-center gap-2 flex-1 justify-center"
                >
                  {step === "launching" ? (
                    <><Loader2 size={13} className="animate-spin" /> Launching scrape…</>
                  ) : (
                    <><Sparkles size={13} /> Launch Campaign</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
