import { useEffect, useState, useMemo } from "react";
import {
  Search, Star, Phone, Mail, Globe, MapPin, Sparkles, RefreshCw,
  SlidersHorizontal, ChevronDown, ChevronUp, Copy, ExternalLink,
  Users, Zap, Filter,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";

type Campaign = { id: string; name: string; leads_imported: number; status: string; created_at: string };
type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
  reviews_count: number | null;
  maps_url: string | null;
  score?: number;
  tier?: "hot" | "warm" | "cold";
  score_factors?: string[];
};

function safeHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

const TIER_STYLE = {
  hot: { tag: "bg-red-500/15 border-red-500/40 text-red-300", dot: "bg-red-400" },
  warm: { tag: "bg-amber/15 border-amber/40 text-amber", dot: "bg-amber" },
  cold: { tag: "bg-white/5 border-white/15 text-white/40", dot: "bg-white/25" },
};

export default function RELeads() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scored, setScored] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [enriching, setEnriching] = useState<{ done: number; total: number; found: number } | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [emailFilter, setEmailFilter] = useState<"all" | "has_email" | "no_email">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    call<Campaign[]>("outreach.campaign.list")
      .then((list) => {
        const ready = list.filter((c) => ["ready", "completed", "sending"].includes(c.status));
        setCampaigns(ready);
        if (ready.length > 0) setSelectedCampaign(ready[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCampaign) return;
    setLeads([]);
    setScored(false);
    setLoading(true);
    call<Lead[]>("outreach.leads.list", { campaign_id: selectedCampaign })
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCampaign]);

  async function scoreLeads() {
    if (!selectedCampaign) return;
    setScoring(true);
    try {
      const result = await call<Lead[]>("re.leads.score", { campaign_id: selectedCampaign });
      setLeads(result);
      setScored(true);
    } finally {
      setScoring(false);
    }
  }

  async function enrichLeads() {
    const targets = leads.filter((l) => !l.email && l.website);
    if (!targets.length) return;
    setEnriching({ done: 0, total: targets.length, found: 0 });
    let done = 0, found = 0;
    for (const lead of targets) {
      try {
        const r = await call<{ enriched?: boolean }>("outreach.leads.enrich_one", {
          campaign_id: selectedCampaign,
          lead_id: lead.id,
        });
        if (r.enriched) found++;
      } catch {}
      done++;
      setEnriching({ done, total: targets.length, found });
      if (done % 5 === 0 || done === targets.length) {
        const fresh = await call<Lead[]>("outreach.leads.list", { campaign_id: selectedCampaign });
        setLeads(fresh);
      }
    }
    setTimeout(() => setEnriching(null), 2500);
  }

  const filtered = useMemo(() => {
    let list = leads;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        (l.name ?? "").toLowerCase().includes(q) ||
        (l.address ?? "").toLowerCase().includes(q) ||
        (l.category ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q),
      );
    }
    if (tierFilter !== "all") list = list.filter((l) => l.tier === tierFilter);
    if (emailFilter === "has_email") list = list.filter((l) => l.email);
    if (emailFilter === "no_email") list = list.filter((l) => !l.email);
    return list;
  }, [leads, search, tierFilter, emailFilter]);

  const stats = useMemo(() => ({
    total: leads.length,
    withEmail: leads.filter((l) => l.email).length,
    withPhone: leads.filter((l) => l.phone).length,
    hot: leads.filter((l) => l.tier === "hot").length,
    warm: leads.filter((l) => l.tier === "warm").length,
  }), [leads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-2xl">Lead Intelligence</h1>
          <p className="text-white/50 text-sm mt-1">Score, enrich, and segment your Dubai RE prospects</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={scoreLeads} disabled={scoring || !leads.length} className="btn-primary flex items-center gap-2 text-xs">
            <Star size={13} />
            {scoring ? "Scoring…" : "Score All Leads"}
          </button>
          <button
            onClick={enrichLeads}
            disabled={!!enriching || !leads.filter((l) => !l.email && l.website).length}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <Sparkles size={13} />
            {enriching ? `Enriching ${enriching.done}/${enriching.total} (${enriching.found} found)` : "Enrich Emails"}
          </button>
        </div>
      </div>

      {/* Campaign selector */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 font-semibold uppercase tracking-wider shrink-0">Campaign:</span>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="input-field text-sm max-w-xs"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.leads_imported} leads)</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      {leads.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          <StatBadge label="Total" value={stats.total} color="text-white" />
          <StatBadge label="With Email" value={stats.withEmail} color="text-blue-400" />
          <StatBadge label="With Phone" value={stats.withPhone} color="text-success" />
          {scored && <StatBadge label="Hot" value={stats.hot} color="text-red-400" />}
          {scored && <StatBadge label="Warm" value={stats.warm} color="text-amber" />}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, area, email…"
            className="input-field pl-9 text-sm w-64"
          />
        </div>

        {scored && (
          <div className="flex items-center gap-1">
            {(["all", "hot", "warm", "cold"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                  tierFilter === t
                    ? t === "hot" ? "bg-red-500/20 border-red-500/40 text-red-300"
                      : t === "warm" ? "bg-amber/20 border-amber/40 text-amber"
                      : t === "cold" ? "bg-white/10 border-white/20 text-white/70"
                      : "bg-primary/15 border-primary/35 text-primary"
                    : "bg-transparent border-white/10 text-white/40 hover:text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          {(["all", "has_email", "no_email"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setEmailFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                emailFilter === f ? "bg-primary/15 border-primary/35 text-primary" : "bg-transparent border-white/10 text-white/40 hover:text-white/70"
              }`}
            >
              {f === "all" ? "All" : f === "has_email" ? "Has email" : "No email"}
            </button>
          ))}
        </div>

        <span className="text-xs text-white/30 ml-auto">{filtered.length} leads shown</span>
      </div>

      {/* Empty state */}
      {!loading && campaigns.length === 0 && (
        <GlassCard className="p-10 text-center">
          <Users size={36} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/60 font-semibold mb-1">No leads yet</p>
          <p className="text-white/40 text-sm">Start a campaign in <a href="/campaigns" className="text-primary hover:underline">Outreach</a> to scrape Dubai RE leads.</p>
        </GlassCard>
      )}

      {loading && (
        <GlassCard className="p-8 text-center">
          <div className="text-white/30 text-sm">Loading leads…</div>
        </GlassCard>
      )}

      {/* Lead table */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const tier = lead.tier;
            const isOpen = expanded === lead.id;
            return (
              <GlassCard key={lead.id} className="p-0 overflow-hidden">
                <div
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : lead.id)}
                >
                  {/* Tier dot */}
                  {tier && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${TIER_STYLE[tier].dot}`} />
                  )}

                  {/* Name + category */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{lead.name}</span>
                      {tier && (
                        <span className={`tag text-[9px] ${TIER_STYLE[tier].tag}`}>
                          {tier}{lead.score !== undefined ? ` ${lead.score}` : ""}
                        </span>
                      )}
                      {lead.category && <span className="text-xs text-white/35">{lead.category}</span>}
                    </div>
                    {lead.address && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-white/35">
                        <MapPin size={10} />{lead.address.slice(0, 70)}
                      </div>
                    )}
                  </div>

                  {/* Contacts */}
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {lead.email ? (
                      <span className="flex items-center gap-1 text-blue-400"><Mail size={11} /><span className="max-w-[140px] truncate">{lead.email}</span></span>
                    ) : (
                      <span className="text-white/20 flex items-center gap-1"><Mail size={11} />No email</span>
                    )}
                    {lead.phone ? (
                      <span className="flex items-center gap-1 text-success"><Phone size={11} />{lead.phone}</span>
                    ) : (
                      <span className="text-white/20 flex items-center gap-1"><Phone size={11} /></span>
                    )}
                    {lead.rating && (
                      <span className="flex items-center gap-1 text-amber"><Star size={11} />{lead.rating}</span>
                    )}
                  </div>

                  {isOpen ? <ChevronUp size={14} className="text-white/30 shrink-0" /> : <ChevronDown size={14} className="text-white/30 shrink-0" />}
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 pt-0 border-t border-white/[0.05] bg-white/[0.01]">
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5 text-xs text-white/50">
                        {lead.website && (
                          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            <Globe size={11} />{safeHostname(lead.website)}
                            <ExternalLink size={9} />
                          </a>
                        )}
                        {lead.reviews_count && <p className="flex items-center gap-1.5"><Star size={11} />{lead.reviews_count} reviews</p>}
                        {lead.maps_url && (
                          <a href={lead.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            <MapPin size={11} />View on Maps <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                      {lead.score_factors && (
                        <div>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Score factors</p>
                          <div className="flex flex-wrap gap-1">
                            {lead.score_factors.map((f) => (
                              <span key={f} className="text-[10px] px-2 py-0.5 bg-white/[0.04] rounded-full text-white/50 border border-white/[0.07]">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {lead.email && (
                        <button onClick={() => navigator.clipboard.writeText(lead.email!)} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                          <Copy size={10} /> Copy email
                        </button>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-success text-xs flex items-center gap-1.5 py-1.5 px-3"
                        >
                          <Phone size={10} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-3 text-center">
      <div className={`text-xl font-display font-bold ${color}`}><AnimatedNumber value={value} /></div>
      <div className="text-[10px] text-white/40 font-semibold mt-0.5 uppercase tracking-wide">{label}</div>
    </GlassCard>
  );
}
