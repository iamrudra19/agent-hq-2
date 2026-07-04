import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw, Users, TrendingUp, Clock, MessageSquare, DollarSign,
  Sparkles, Copy, ChevronRight, Loader2, AlertCircle, Send,
  Zap, Mail, Phone, X, CheckCircle,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";

type ReactivationLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  address: string | null;
  campaign_id: string;
  age_days: number;
  score?: number;
  tier?: "hot" | "warm" | "cold";
};

type Bucket = "30" | "60" | "90" | "180";

type CandidatesResponse = {
  buckets: Record<Bucket, ReactivationLead[]>;
  totals: Record<Bucket, number>;
};

const BUCKET_META: Record<Bucket, { label: string; sub: string; color: string; tag: string }> = {
  "30": { label: "30+ Days", sub: "Warm cool-down", color: "text-success", tag: "bg-success/15 border-success/35 text-success" },
  "60": { label: "60+ Days", sub: "Attention needed", color: "text-amber", tag: "bg-amber/15 border-amber/35 text-amber" },
  "90": { label: "90+ Days", sub: "Cold - reignite", color: "text-accent", tag: "bg-accent/15 border-accent/35 text-accent" },
  "180": { label: "6+ Months", sub: "Frozen - last shot", color: "text-danger", tag: "bg-danger/15 border-danger/35 text-danger" },
};

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: Phone, color: "text-success", note: "90%+ UAE RE. 67% open rate." },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "text-primary", note: "60% open rate, high urgency." },
  { id: "email", label: "Email", icon: Mail, color: "text-blue-400", note: "22% open rate, deeper content." },
];

const REASONS = [
  { id: "market_update", label: "Dubai Market Boom Update" },
  { id: "new_listing", label: "New Matching Listing" },
  { id: "price_drop", label: "Price / ROI Opportunity" },
  { id: "holiday", label: "Seasonal Check-in" },
  { id: "follow_up", label: "Warm Follow-up" },
];

export default function REReactivation() {
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bucket, setBucket] = useState<Bucket>("30");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<string>("whatsapp");
  const [reason, setReason] = useState<string>("market_update");
  const [campaignName, setCampaignName] = useState("Q1 Reactivation Sweep");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { message?: string; subject?: string; body?: string }>>({});
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const d = await call<CandidatesResponse>("re.reactivation.candidates").catch(() => null);
      setData(d);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { void load(); }, []);

  const currentLeads = data?.buckets[bucket] ?? [];
  const totals = data?.totals ?? { "30": 0, "60": 0, "90": 0, "180": 0 };
  const totalInactive = totals["30"] + totals["60"] + totals["90"] + totals["180"];

  const selected = useMemo(
    () => currentLeads.filter((l) => selectedIds.has(l.id)),
    [currentLeads, selectedIds],
  );

  const insights = useMemo(() => {
    const successRate = bucket === "30" ? "31-42%"
      : bucket === "60" ? "23-31%"
      : bucket === "90" ? "15-22%"
      : "8-14%";
    const bestTime = channel === "whatsapp" ? "6-9 PM GST"
      : channel === "email" ? "8-11 AM GST"
      : "2-5 PM GST";
    const preferredChannel = "WhatsApp (67% open)";
    const highValue = currentLeads.filter((l) => l.email && l.phone).length;
    const highValuePct = currentLeads.length ? Math.round((highValue / currentLeads.length) * 100) : 0;
    return { successRate, bestTime, preferredChannel, highValue, highValuePct };
  }, [bucket, channel, currentLeads]);

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  function selectAll() {
    if (selectedIds.size === currentLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentLeads.map((l) => l.id)));
    }
  }

  async function generateOne(lead: ReactivationLead) {
    setGeneratingId(lead.id); setError(null);
    try {
      const result = await call<any>("re.reactivation.generate", {
        lead_id: lead.id,
        campaign_id: lead.campaign_id,
        channel,
        reason,
      });
      setDrafts((prev) => ({ ...prev, [lead.id]: result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGeneratingId(null);
    }
  }

  async function generateBulk() {
    if (selected.length === 0) return;
    setBulkProgress({ done: 0, total: selected.length }); setError(null);
    for (let i = 0; i < selected.length; i++) {
      const lead = selected[i];
      try {
        const result = await call<any>("re.reactivation.generate", {
          lead_id: lead.id,
          campaign_id: lead.campaign_id,
          channel,
          reason,
        });
        setDrafts((prev) => ({ ...prev, [lead.id]: result }));
      } catch {}
      setBulkProgress({ done: i + 1, total: selected.length });
    }
    setTimeout(() => setBulkProgress(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-2xl flex items-center gap-3">
            <RefreshCw size={24} className="text-accent" />
            Database Reactivation
          </h1>
          <p className="text-white/50 text-sm mt-1">Warm up dormant leads and re-engage past prospects — highest ROI channel in RE</p>
        </div>
        <button onClick={load} className="btn-secondary text-xs flex items-center gap-2">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 border-accent/25 bg-accent/[0.03]">
          <div className="flex items-center gap-2 mb-1">
            <Users size={13} className="text-accent" />
            <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">Inactive Leads</span>
          </div>
          <div className="text-3xl font-display font-bold text-accent"><AnimatedNumber value={totalInactive} /></div>
          <div className="text-[10px] text-white/40 mt-1">Across all buckets</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={13} className="text-primary" />
            <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">Selected</span>
          </div>
          <div className="text-3xl font-display font-bold text-primary"><AnimatedNumber value={selectedIds.size} /></div>
          <div className="text-[10px] text-white/40 mt-1">Ready for re-engagement</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={13} className="text-success" />
            <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">Drafts Generated</span>
          </div>
          <div className="text-3xl font-display font-bold text-success"><AnimatedNumber value={Object.keys(drafts).length} /></div>
          <div className="text-[10px] text-white/40 mt-1">AI messages ready to send</div>
        </GlassCard>
      </div>

      {/* Smart Insights */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={13} className="text-primary" />
          <p className="font-display font-bold text-xs text-white/60 tracking-widest uppercase">Smart Lead Insights — {BUCKET_META[bucket].label}</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <InsightCard icon={TrendingUp} value={insights.successRate} label="Predicted Success Rate" color="bg-success/10 text-success" />
          <InsightCard icon={Clock} value={insights.bestTime} label="Best Contact Time" color="bg-primary/10 text-primary" />
          <InsightCard icon={MessageSquare} value={insights.preferredChannel} label="Preferred Channel" color="bg-purple/10 text-purple" />
          <InsightCard icon={DollarSign} value={`${insights.highValuePct}% of selection`} label={`${insights.highValue} High-Value Leads`} color="bg-accent/10 text-accent" />
        </div>
      </GlassCard>

      {/* Bucket tabs */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(BUCKET_META) as Bucket[]).map((b) => {
          const meta = BUCKET_META[b];
          const active = bucket === b;
          return (
            <button
              key={b}
              onClick={() => { setBucket(b); setSelectedIds(new Set()); }}
              className={`glass p-4 rounded-2xl border transition-all text-left ${active ? "border-primary/50 bg-primary/[0.06]" : "border-white/10 hover:border-white/25"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                <span className="text-xl font-display font-bold text-white">{totals[b]}</span>
              </div>
              <div className="text-[10px] text-white/40">{meta.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* Leads list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-sm text-white/80 tracking-widest uppercase">Select Inactive Leads</p>
            {currentLeads.length > 0 && (
              <button onClick={selectAll} className="text-xs text-primary hover:underline">
                {selectedIds.size === currentLeads.length ? "Deselect all" : `Select all (${currentLeads.length})`}
              </button>
            )}
          </div>

          {!loaded && (
            <GlassCard className="p-8 text-center"><div className="text-white/30 text-sm">Loading candidates…</div></GlassCard>
          )}

          {loaded && currentLeads.length === 0 && (
            <GlassCard className="p-10 text-center">
              <Users size={32} className="mx-auto mb-2 text-white/15" />
              <p className="text-white/50 text-sm">No leads in this bucket. Run outreach campaigns first to build your database.</p>
            </GlassCard>
          )}

          <div className="space-y-2">
            {currentLeads.map((lead) => {
              const draft = drafts[lead.id];
              const isGen = generatingId === lead.id;
              const isSel = selectedIds.has(lead.id);
              return (
                <GlassCard key={lead.id} className={`p-0 overflow-hidden transition-colors ${isSel ? "border-primary/40" : ""}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelect(lead.id)}
                      className="w-4 h-4 accent-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{lead.name}</span>
                        <span className={`tag text-[9px] ${BUCKET_META[bucket].tag}`}>{lead.age_days}d idle</span>
                        {lead.tier && (
                          <span className={`tag text-[9px] ${
                            lead.tier === "hot" ? "bg-red-500/15 border-red-500/40 text-red-300"
                            : lead.tier === "warm" ? "bg-amber/15 border-amber/40 text-amber"
                            : "bg-white/5 border-white/15 text-white/40"
                          }`}>{lead.tier}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                        {lead.email && <span className="flex items-center gap-1 text-blue-400/70"><Mail size={10} />{lead.email.slice(0, 30)}</span>}
                        {lead.phone && <span className="flex items-center gap-1 text-success/70"><Phone size={10} />{lead.phone}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => generateOne(lead)}
                      disabled={isGen}
                      className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 shrink-0"
                    >
                      {isGen ? <><Loader2 size={11} className="animate-spin" /> AI…</> : <><Sparkles size={11} /> Draft</>}
                    </button>
                  </div>

                  {draft && (
                    <div className="px-4 pb-3 border-t border-white/[0.05] bg-white/[0.01]">
                      <div className="mt-3 space-y-2">
                        {draft.subject && (
                          <div>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Subject</p>
                            <p className="text-sm text-white/80 font-semibold">{draft.subject}</p>
                          </div>
                        )}
                        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                          <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
                            {draft.message ?? draft.body ?? ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(draft.message ?? `${draft.subject}\n\n${draft.body}`)}
                            className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
                          >
                            <Copy size={10} /> Copy
                          </button>
                          {channel === "whatsapp" && lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(draft.message ?? "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-success text-xs flex items-center gap-1.5 py-1 px-2.5"
                            >
                              <Send size={10} /> Open WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Campaign setup */}
        <div className="space-y-4">
          <GlassCard className="p-5 space-y-4 sticky top-4">
            <p className="font-display font-bold text-sm text-white/80 tracking-widest uppercase">Campaign Setup</p>

            <div>
              <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1.5 block">Campaign Name</label>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="input-field text-sm" />
            </div>

            <div>
              <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Channel</label>
              <div className="space-y-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChannel(ch.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      channel === ch.id ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ch.icon size={13} className={ch.color} />
                      <span className="font-bold text-sm text-white">{ch.label}</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5 ml-5">{ch.note}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1.5 block">Angle / Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="input-field text-sm">
                {REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-lg text-xs text-danger">
                <AlertCircle size={12} /> {error}
              </div>
            )}

            <button
              onClick={generateBulk}
              disabled={selectedIds.size === 0 || !!bulkProgress}
              className="btn-primary w-full flex items-center gap-2 justify-center text-sm"
            >
              {bulkProgress
                ? <><Loader2 size={13} className="animate-spin" /> Drafting {bulkProgress.done}/{bulkProgress.total}…</>
                : <><Sparkles size={13} /> Draft All Selected ({selectedIds.size})</>
              }
            </button>

            {selectedIds.size === 0 && (
              <p className="text-[10px] text-white/30 text-center">Select leads from the list to enable bulk drafting</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, value, label, color }: { icon: React.ElementType<any>; value: string; label: string; color: string }) {
  const [bg, txt] = color.split(" ");
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={16} className={txt} />
      </div>
      <div className="min-w-0">
        <div className={`font-display font-bold text-sm ${txt}`}>{value}</div>
        <div className="text-[10px] text-white/40 truncate">{label}</div>
      </div>
    </div>
  );
}
