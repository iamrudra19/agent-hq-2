import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Users,
  Search,
  MapPin,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MousePointerClick,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Phone,
  Globe,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
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

type EmailRecord = {
  id: string;
  campaign_id: string;
  lead_id: string;
  to_email: string;
  to_name: string;
  subject: string;
  body_text: string;
  body_html: string;
  sender_name: string | null;
  status: "drafted" | "sent" | "delivered" | "bounced" | "clicked" | "replied" | "complained" | "failed";
  sequence_position: number;
  sequence_total: number;
  framework: string | null;
  source: string;
  click_count: number;
  created_at: string;
  updated_at: string;
};

type WhatsAppMessage = {
  id: string;
  campaign_id: string;
  lead_id: string;
  to_phone: string | null;
  to_name: string;
  wa_text: string;
  character_count: number;
  language: "en";
  sequence_position: number;
  framework: string | null;
  status: "drafted" | "sent" | "delivered" | "replied";
  created_at: string;
  updated_at: string;
};

type ActiveTab = "leads" | "email" | "whatsapp";
type Framework = "pas" | "aida" | "sdr" | "one-off";

const STATUS_COLORS: Record<Campaign["status"], string> = {
  draft: "bg-white/10 border-white/20 text-white/70",
  searching: "bg-primary/15 border-primary/40 text-primary",
  ready: "bg-accent/15 border-accent/40 text-accent",
  sending: "bg-purple/15 border-purple/40 text-purple",
  completed: "bg-green-500/15 border-green-500/40 text-green-300",
  failed: "bg-red-500/15 border-red-500/40 text-red-300",
};

const EMAIL_STATUS_ICONS: Record<EmailRecord["status"], React.ReactNode> = {
  drafted: <span className="w-2 h-2 rounded-full bg-white/30 inline-block" />,
  sent: <Send size={12} className="text-white/50" />,
  delivered: <CheckCircle2 size={12} className="text-blue-400" />,
  bounced: <XCircle size={12} className="text-red-400" />,
  clicked: <MousePointerClick size={12} className="text-purple" />,
  replied: <MessageSquare size={12} className="text-accent" />,
  complained: <AlertCircle size={12} className="text-orange-400" />,
  failed: <XCircle size={12} className="text-red-400" />,
};

const TIER_COLORS = { hot: "text-red-400 bg-red-400/10 border-red-400/30", warm: "text-amber-400 bg-amber-400/10 border-amber-400/30", cold: "text-white/40 bg-white/5 border-white/10" };

export default function DubaiRECampaign() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([]);
  const [scoredLeads, setScoredLeads] = useState<Lead[] | null>(null);
  const [tab, setTab] = useState<ActiveTab>("leads");
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Generation state
  const [senderName, setSenderName] = useState("Arjun");
  const [senderOffer, setSenderOffer] = useState("");
  const [framework, setFramework] = useState<Framework>("pas");
  const [totalSteps, setTotalSteps] = useState(3);
  const [genStep, setGenStep] = useState(1);
  const [genProgress, setGenProgress] = useState<{ done: number; total: number; type: "email" | "wa" } | null>(null);
  const [enrichProgress, setEnrichProgress] = useState<{ done: number; total: number; found: number } | null>(null);
  const [scoring, setScoring] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [expandedWa, setExpandedWa] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [camp, leadList, emailList, waList] = await Promise.all([
        call<Campaign>("outreach.campaign.get", { id }),
        call<Lead[]>("outreach.leads.list", { campaign_id: id }),
        call<EmailRecord[]>("outreach.emails.list", { campaign_id: id }),
        call<WhatsAppMessage[]>("re.whatsapp.list", { campaign_id: id }),
      ]);
      setCampaign(camp);
      setLeads(leadList);
      setEmails(emailList);
      setWaMessages(waList);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while searching
  useEffect(() => {
    if (campaign?.status !== "searching") return;
    const tick = async () => {
      const result = await call<{ status: string; changed: boolean }>("outreach.campaign.sync", { id });
      if (result.changed) await refresh();
    };
    void tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [id, campaign?.status, refresh]);

  async function scoreLeads() {
    if (!id) return;
    setScoring(true);
    try {
      const scored = await call<Lead[]>("re.leads.score", { campaign_id: id });
      setScoredLeads(scored);
    } finally {
      setScoring(false);
    }
  }

  async function enrichLeads() {
    const targets = leads.filter((l) => !l.email && l.website);
    if (!targets.length) return;
    setEnrichProgress({ done: 0, total: targets.length, found: 0 });
    let done = 0;
    let found = 0;
    for (const lead of targets) {
      try {
        const r = await call<{ enriched?: boolean }>("outreach.leads.enrich_one", { campaign_id: id, lead_id: lead.id });
        if (r.enriched) found++;
      } catch {
        // continue on individual failure
      }
      done++;
      setEnrichProgress({ done, total: targets.length, found });
      if (done % 3 === 0 || done === targets.length) await refresh();
    }
    setTimeout(() => setEnrichProgress(null), 3000);
  }

  async function generateEmails() {
    if (!id) return;
    const leadsWithEmail = (scoredLeads ?? leads).filter((l) => l.email);
    if (!leadsWithEmail.length) { alert("No leads with email addresses. Run email enrichment first."); return; }

    const planned = leadsWithEmail.map((l) => ({ lead: l, step: genStep }));
    setGenProgress({ done: 0, total: planned.length, type: "email" });

    let done = 0;
    for (const { lead } of planned) {
      try {
        await call("re.emails.generate_re_one", {
          campaign_id: id,
          lead_id: lead.id,
          sender_name: senderName,
          sender_offer: senderOffer || undefined,
          step: genStep,
          total_steps: totalSteps,
          framework: framework === "one-off" ? null : framework,
        });
      } catch {
        // per-lead failure doesn't halt batch
      }
      done++;
      setGenProgress({ done, total: planned.length, type: "email" });
      if (done % 3 === 0 || done === planned.length) await refresh();
    }
    setGenProgress(null);
  }

  async function generateWhatsApp() {
    if (!id) return;
    const allLeads = scoredLeads ?? leads;
    if (!allLeads.length) return;

    setGenProgress({ done: 0, total: allLeads.length, type: "wa" });
    let done = 0;
    for (const lead of allLeads) {
      try {
        await call("re.whatsapp.generate_one", {
          campaign_id: id,
          lead_id: lead.id,
          sender_name: senderName,
          step: genStep,
          total_steps: totalSteps,
          framework: framework === "one-off" ? null : framework,
        });
      } catch {
        // per-lead failure doesn't halt batch
      }
      done++;
      setGenProgress({ done, total: allLeads.length, type: "wa" });
      if (done % 5 === 0 || done === allLeads.length) await refresh();
    }
    setGenProgress(null);
  }

  async function sendEmails() {
    if (!id) return;
    if (!confirm(`Send all drafted emails for step ${genStep}?`)) return;
    setSendingEmails(true);
    try {
      await call("outreach.emails.send", { campaign_id: id, sequence_position: genStep });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingEmails(false);
    }
  }

  const displayLeads = scoredLeads ?? leads;

  const emailsByLead = useMemo(() => {
    const map = new Map<string, EmailRecord[]>();
    for (const e of emails) {
      const arr = map.get(e.lead_id) ?? [];
      arr.push(e);
      map.set(e.lead_id, arr);
    }
    return map;
  }, [emails]);

  const waByLead = useMemo(() => {
    const map = new Map<string, WhatsAppMessage[]>();
    for (const m of waMessages) {
      const arr = map.get(m.lead_id) ?? [];
      arr.push(m);
      map.set(m.lead_id, arr);
    }
    return map;
  }, [waMessages]);

  const counters = useMemo(() => ({
    leadsTotal: leads.length,
    leadsWithEmail: leads.filter((l) => l.email).length,
    leadsWithPhone: leads.filter((l) => l.phone).length,
    emailsDrafted: emails.filter((e) => e.status === "drafted").length,
    emailsSent: emails.filter((e) => e.status !== "drafted").length,
    emailsReplied: emails.filter((e) => e.status === "replied").length,
    waDrafted: waMessages.filter((m) => m.status === "drafted").length,
    waReplied: waMessages.filter((m) => m.status === "replied").length,
  }), [leads, emails, waMessages]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 text-sm">Loading campaign…</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Link to="/re" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-fit">
          <ArrowLeft size={14} /> Back to Dubai RE SDR
        </Link>
        <GlassCard className="p-8 text-center">
          <p className="text-red-300">{err ?? "Campaign not found"}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/re" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-fit mb-4">
          <ArrowLeft size={14} /> Dubai RE SDR
        </Link>
        <PageHeader
          title={campaign.name}
          subtitle={campaign.structured_query ? `${campaign.structured_query.location} · ${campaign.structured_query.searchTerms.slice(0, 2).join(", ")}` : campaign.query}
          right={
            <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wide ${STATUS_COLORS[campaign.status]}`}>
              {campaign.status}
              {campaign.status === "searching" && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </span>
          }
        />
      </div>

      {err && (
        <GlassCard className="p-4 border-red-500/30">
          <p className="text-sm text-red-300">{err}</p>
        </GlassCard>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-6 gap-3">
        <StatCard label="Total Leads" value={counters.leadsTotal} icon={Users} />
        <StatCard label="With Email" value={counters.leadsWithEmail} icon={Mail} color="text-blue-400" />
        <StatCard label="With Phone" value={counters.leadsWithPhone} icon={Phone} color="text-green-400" />
        <StatCard label="Emails Sent" value={counters.emailsSent} icon={Send} color="text-purple" />
        <StatCard label="WA Drafted" value={counters.waDrafted} icon={MessageSquare} color="text-accent" />
        <StatCard label="Replied" value={counters.emailsReplied + counters.waReplied} icon={TrendingUp} color="text-red-400" />
      </div>

      {/* Searching state */}
      {campaign.status === "searching" && (
        <GlassCard className="p-5 border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div>
              <p className="text-sm font-semibold text-primary">Scraping Dubai RE leads…</p>
              <p className="text-xs text-white/50 mt-0.5">Apify Google Maps scrape in progress. This usually takes 1–3 minutes.</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Generator panel */}
      {campaign.status !== "searching" && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-display font-bold tracking-widest uppercase text-white/50 mb-4">Generation Controls</h3>
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Your Name</label>
              <input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="input-field text-sm w-full" placeholder="Arjun" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Custom Context (optional)</label>
              <input value={senderOffer} onChange={(e) => setSenderOffer(e.target.value)} className="input-field text-sm w-full" placeholder="e.g. We have a case study from a JLT brokerage" />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Framework</label>
              <select value={framework} onChange={(e) => setFramework(e.target.value as Framework)} className="input-field text-sm w-full">
                <option value="pas">PAS (Problem → Agitate → Solution)</option>
                <option value="aida">AIDA (Attention → Interest → Desire)</option>
                <option value="sdr">SDR (Direct → Value → Breakup)</option>
                <option value="one-off">One-off (No sequence)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Step</label>
                <input type="number" min={1} max={3} value={genStep} onChange={(e) => setGenStep(Number(e.target.value))} className="input-field text-sm w-full" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Total</label>
                <input type="number" min={1} max={3} value={totalSteps} onChange={(e) => setTotalSteps(Number(e.target.value))} className="input-field text-sm w-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={enrichLeads}
              disabled={!!enrichProgress || leads.filter((l) => !l.email && l.website).length === 0}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Globe size={13} />
              {enrichProgress
                ? `Enriching… ${enrichProgress.done}/${enrichProgress.total} (${enrichProgress.found} found)`
                : `Enrich Emails (${leads.filter((l) => !l.email && l.website).length} targets)`}
            </button>

            <button
              onClick={scoreLeads}
              disabled={scoring || leads.length === 0}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Star size={13} />
              {scoring ? "Scoring…" : "Score Leads"}
            </button>

            <div className="flex-1" />

            <button
              onClick={generateEmails}
              disabled={!!genProgress || counters.leadsWithEmail === 0}
              className="btn-secondary text-xs flex items-center gap-1.5 border-blue-400/40 text-blue-300 hover:bg-blue-400/10"
            >
              <Mail size={13} />
              {genProgress?.type === "email"
                ? `Generating… ${genProgress.done}/${genProgress.total}`
                : `Generate RE Emails (Step ${genStep})`}
            </button>

            {counters.emailsDrafted > 0 && (
              <button
                onClick={sendEmails}
                disabled={sendingEmails}
                className="btn-secondary text-xs flex items-center gap-1.5 border-purple/40 text-purple hover:bg-purple/10"
              >
                <Send size={13} />
                {sendingEmails ? "Sending…" : `Send Drafted Emails (${counters.emailsDrafted})`}
              </button>
            )}

            <button
              onClick={generateWhatsApp}
              disabled={!!genProgress || leads.length === 0}
              className="btn-secondary text-xs flex items-center gap-1.5 border-green-400/40 text-green-300 hover:bg-green-400/10"
            >
              <MessageSquare size={13} />
              {genProgress?.type === "wa"
                ? `Generating… ${genProgress.done}/${genProgress.total}`
                : `Generate WhatsApp (Step ${genStep})`}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {(["leads", "email", "whatsapp"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t === "leads" && `Leads (${counters.leadsTotal})`}
            {t === "email" && `Email Outreach (${emails.length})`}
            {t === "whatsapp" && `WhatsApp (${waMessages.length})`}
          </button>
        ))}
      </div>

      {/* LEADS TAB */}
      {tab === "leads" && (
        <div className="space-y-2">
          {scoredLeads && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-white/40">Sorted by AI lead score</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full border text-red-400 bg-red-400/10 border-red-400/30">hot ≥70</span>
                <span className="px-2 py-0.5 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/30">warm ≥45</span>
                <span className="px-2 py-0.5 rounded-full border text-white/40 bg-white/5 border-white/10">cold</span>
              </div>
            </div>
          )}

          {displayLeads.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Users size={32} className="mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm">
                {campaign.status === "searching" ? "Leads are being scraped…" : "No leads found. Check your ICP and Apify key."}
              </p>
            </GlassCard>
          )}

          {displayLeads.map((lead) => {
            const leadEmails = emailsByLead.get(lead.id) ?? [];
            const leadWa = waByLead.get(lead.id) ?? [];
            return (
              <GlassCard key={lead.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white truncate">{lead.name}</span>
                      {lead.tier && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${TIER_COLORS[lead.tier]}`}>
                          {lead.tier} {lead.score}
                        </span>
                      )}
                      {lead.category && <span className="text-xs text-white/40">{lead.category}</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-white/40">
                      {lead.address && (
                        <span className="flex items-center gap-1"><MapPin size={11} />{lead.address.slice(0, 60)}</span>
                      )}
                      {lead.rating && (
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" />{lead.rating} ({lead.reviews_count ?? 0})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                      {lead.email ? (
                        <span className="flex items-center gap-1 text-blue-300"><Mail size={11} />{lead.email}</span>
                      ) : (
                        <span className="text-white/25 flex items-center gap-1"><Mail size={11} />No email</span>
                      )}
                      {lead.phone ? (
                        <span className="flex items-center gap-1 text-green-300"><Phone size={11} />{lead.phone}</span>
                      ) : (
                        <span className="text-white/25 flex items-center gap-1"><Phone size={11} />No phone</span>
                      )}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white/40 hover:text-white transition-colors">
                          <Globe size={11} />{new URL(lead.website).hostname.replace("www.", "").slice(0, 30)}
                        </a>
                      )}
                    </div>

                    {lead.score_factors && lead.score_factors.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {lead.score_factors.map((f) => (
                          <span key={f} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-white/40">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs text-white/30">
                    {leadEmails.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-400/70"><Mail size={11} />{leadEmails.length}</span>
                    )}
                    {leadWa.length > 0 && (
                      <span className="flex items-center gap-1 text-green-400/70"><MessageSquare size={11} />{leadWa.length}</span>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* EMAIL TAB */}
      {tab === "email" && (
        <div className="space-y-2">
          {emails.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Mail size={32} className="mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm mb-1">No emails generated yet.</p>
              <p className="text-xs text-white/30">Enrich leads with email addresses, then click "Generate RE Emails".</p>
            </GlassCard>
          )}

          {emails
            .filter((e) => e.source === "re_ai_drafted" || e.source === "agent_drafted" || !e.source)
            .sort((a, b) => a.sequence_position - b.sequence_position || a.created_at.localeCompare(b.created_at))
            .map((email) => {
              const lead = leads.find((l) => l.id === email.lead_id);
              const isExpanded = expandedEmail === email.id;
              return (
                <GlassCard key={email.id} className="p-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                  >
                    <div className="mt-0.5">{EMAIL_STATUS_ICONS[email.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-white/40 font-mono">Step {email.sequence_position}</span>
                        {email.framework && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/40 uppercase">{email.framework}</span>
                        )}
                        <span className="text-sm font-semibold text-white truncate">{email.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                        <span>{email.to_name}</span>
                        <span>·</span>
                        <span>{email.to_email}</span>
                        {lead?.address && <span>· {lead.address.split(",")[0]}</span>}
                        <span>·</span>
                        <span className="capitalize">{email.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                      <div className="prose-sm text-white/70 text-sm leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-lg p-3 font-mono text-xs">
                        {email.body_text}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(email.body_text); }}
                          className="btn-secondary text-xs flex items-center gap-1.5"
                        >
                          <Copy size={11} /> Copy text
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(email.subject); }}
                          className="btn-secondary text-xs flex items-center gap-1.5"
                        >
                          <Copy size={11} /> Copy subject
                        </button>
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })}
        </div>
      )}

      {/* WHATSAPP TAB */}
      {tab === "whatsapp" && (
        <div className="space-y-2">
          {waMessages.length === 0 && (
            <GlassCard className="p-8 text-center">
              <MessageSquare size={32} className="mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm mb-1">No WhatsApp messages generated yet.</p>
              <p className="text-xs text-white/30">Click "Generate WhatsApp" to create personalized messages for all leads.</p>
              <div className="mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-xs text-green-300/70 max-w-sm mx-auto">
                WhatsApp drives 90%+ of UAE RE communication. 25–35% conversion rate vs 1–3% for email.
              </div>
            </GlassCard>
          )}

          {waMessages
            .sort((a, b) => a.sequence_position - b.sequence_position || a.created_at.localeCompare(b.created_at))
            .map((msg) => {
              const lead = leads.find((l) => l.id === msg.lead_id);
              const isExpanded = expandedWa === msg.id;
              return (
                <GlassCard key={msg.id} className="p-4 border-green-500/10">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedWa(isExpanded ? null : msg.id)}
                  >
                    <MessageSquare size={14} className="text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-white/40 font-mono">Step {msg.sequence_position}</span>
                        <span className="text-sm font-semibold text-white">{msg.to_name}</span>
                        {msg.to_phone ? (
                          <span className="text-xs text-green-300">{msg.to_phone}</span>
                        ) : (
                          <span className="text-xs text-white/25">No phone on file</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-green-500/30 text-green-400/70 uppercase">{msg.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-white/40 line-clamp-1">{msg.wa_text.slice(0, 80)}…</div>
                      <div className="mt-1 text-xs text-white/25">{msg.character_count} chars</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                        <div className="text-xs text-green-400/70 mb-2 uppercase tracking-wider">WhatsApp Message Preview</div>
                        <pre className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans">{msg.wa_text}</pre>
                      </div>
                      {lead && (
                        <div className="text-xs text-white/30">
                          Target: {lead.name}{lead.address ? ` · ${lead.address.split(",")[0]}` : ""}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.wa_text); }}
                          className="btn-secondary text-xs flex items-center gap-1.5"
                        >
                          <Copy size={11} /> Copy message
                        </button>
                        {msg.to_phone && (
                          <a
                            href={`https://wa.me/${msg.to_phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg.wa_text)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-secondary text-xs flex items-center gap-1.5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            <MessageSquare size={11} /> Open in WhatsApp
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

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-white",
}: {
  label: string;
  value: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ElementType<any>;
  color?: string;
}) {
  return (
    <GlassCard className="p-4">
      <Icon size={16} className={`mb-2 ${color}`} />
      <div className={`text-2xl font-display font-bold ${color}`}>
        <AnimatedNumber value={value} />
      </div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </GlassCard>
  );
}
