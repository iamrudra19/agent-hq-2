import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Users, Send, MessageSquare, TrendingUp,
  Star, Phone, Mail, Globe, MapPin, Sparkles, RefreshCw,
  ChevronDown, ChevronUp, Copy, ExternalLink, Loader2,
  CheckCircle, AlertCircle, Zap, Clock,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  status: string;
  leads_imported: number;
  emails_generated: number;
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  emails_clicked: number;
  emails_replied: number;
  created_at: string;
  updated_at: string;
  structured_query: { location: string; searchTerms: string[] } | null;
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

type GeneratedEmail = {
  lead_id: string;
  lead_name: string;
  subject: string;
  body: string;
  sent?: boolean;
  sent_at?: string;
};

type WhatsAppMessage = {
  lead_id: string;
  lead_name: string;
  phone: string;
  message: string;
  generated_at: string;
};

const TIER_STYLE = {
  hot: { tag: "bg-red-500/15 border-red-500/40 text-red-300", dot: "bg-red-400" },
  warm: { tag: "bg-amber/15 border-amber/40 text-amber", dot: "bg-amber" },
  cold: { tag: "bg-white/5 border-white/15 text-white/40", dot: "bg-white/25" },
};

type Tab = "leads" | "emails" | "whatsapp";

export default function RECampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([]);
  const [tab, setTab] = useState<Tab>("leads");
  const [loading, setLoading] = useState(true);
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [generatingWA, setGeneratingWA] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    if (!id) return;
    setLoading(true);
    try {
      const [camps, ls, em, wa] = await Promise.all([
        call<Campaign[]>("outreach.campaign.list").catch(() => []),
        call<Lead[]>("outreach.leads.list", { campaign_id: id }).catch(() => []),
        call<GeneratedEmail[]>("outreach.emails.list", { campaign_id: id }).catch(() => []),
        call<WhatsAppMessage[]>("re.whatsapp.list", { campaign_id: id }).catch(() => []),
      ]);
      const camp = camps.find((c) => c.id === id) ?? null;
      setCampaign(camp);
      setLeads(ls);
      setEmails(em);
      setWaMessages(wa);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, [id]);

  async function generateEmails() {
    if (!id) return;
    setGeneratingEmails(true);
    setError(null);
    try {
      await call("re.emails.generate_re", { campaign_id: id });
      const fresh = await call<GeneratedEmail[]>("outreach.emails.list", { campaign_id: id });
      setEmails(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate emails");
    } finally {
      setGeneratingEmails(false);
    }
  }

  async function generateWAMessages() {
    if (!id) return;
    setGeneratingWA(true);
    setError(null);
    try {
      await call("re.whatsapp.generate_one", { campaign_id: id, all: true });
      const fresh = await call<WhatsAppMessage[]>("re.whatsapp.list", { campaign_id: id });
      setWaMessages(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate messages");
    } finally {
      setGeneratingWA(false);
    }
  }

  async function sendAllEmails() {
    if (!id) return;
    setSendingAll(true);
    setError(null);
    try {
      await call("outreach.campaign.send_all", { campaign_id: id });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/campaigns" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-3 transition-colors w-fit">
          <ArrowLeft size={12} /> Back to Campaigns
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title text-2xl">{campaign?.name ?? "Campaign"}</h1>
            {campaign?.structured_query && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-white/40">
                <MapPin size={12} />
                <span>{campaign.structured_query.location}</span>
                <span className="text-white/20">·</span>
                <span>{campaign.structured_query.searchTerms.slice(0, 2).join(", ")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="btn-secondary flex items-center gap-2 text-xs">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        <MiniStat label="Leads" value={campaign?.leads_imported ?? 0} color="text-white" />
        <MiniStat label="Emails Gen." value={campaign?.emails_generated ?? 0} color="text-primary" />
        <MiniStat label="Sent" value={campaign?.emails_sent ?? 0} color="text-blue-400" />
        <MiniStat label="Delivered" value={campaign?.emails_delivered ?? 0} color="text-purple" />
        <MiniStat label="Clicked" value={campaign?.emails_clicked ?? 0} color="text-accent" />
        <MiniStat label="Replied" value={campaign?.emails_replied ?? 0} color="text-success" />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-xl text-xs text-danger">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-0">
        {(["leads", "emails", "whatsapp"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t === "whatsapp" ? "WhatsApp" : t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-1.5 text-[10px] font-bold opacity-60">
              {t === "leads" ? leads.length : t === "emails" ? emails.length : waMessages.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "leads" && (
        <LeadsTab leads={leads} expanded={expanded} setExpanded={setExpanded} />
      )}

      {tab === "emails" && (
        <EmailsTab
          emails={emails}
          leads={leads}
          campaignId={id!}
          expanded={expanded}
          setExpanded={setExpanded}
          generating={generatingEmails}
          sending={sendingAll}
          onGenerate={generateEmails}
          onSendAll={sendAllEmails}
        />
      )}

      {tab === "whatsapp" && (
        <WhatsAppTab
          messages={waMessages}
          leads={leads}
          generating={generatingWA}
          onGenerate={generateWAMessages}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-3 text-center">
      <div className={`text-xl font-display font-bold ${color}`}><AnimatedNumber value={value} /></div>
      <div className="text-[9px] text-white/35 font-semibold mt-0.5 uppercase tracking-wide">{label}</div>
    </GlassCard>
  );
}

function LeadsTab({ leads, expanded, setExpanded }: {
  leads: Lead[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}) {
  if (leads.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <Users size={32} className="mx-auto mb-2 text-white/15" />
        <p className="text-white/50 text-sm">Leads will appear here once the campaign finishes scraping.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => {
        const tier = lead.tier;
        const isOpen = expanded === lead.id;
        return (
          <GlassCard key={lead.id} className="p-0 overflow-hidden">
            <div
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpanded(isOpen ? null : lead.id)}
            >
              {tier && <span className={`w-2 h-2 rounded-full shrink-0 ${TIER_STYLE[tier].dot}`} />}
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
                    <MapPin size={10} />{lead.address.slice(0, 65)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                {lead.email ? (
                  <span className="flex items-center gap-1 text-blue-400"><Mail size={11} /><span className="max-w-[130px] truncate">{lead.email}</span></span>
                ) : (
                  <span className="text-white/20 flex items-center gap-1"><Mail size={11} />—</span>
                )}
                {lead.phone ? (
                  <span className="flex items-center gap-1 text-success"><Phone size={11} /></span>
                ) : (
                  <span className="text-white/15"><Phone size={11} /></span>
                )}
                {lead.rating && <span className="flex items-center gap-1 text-amber"><Star size={11} />{lead.rating}</span>}
              </div>
              {isOpen ? <ChevronUp size={14} className="text-white/30 shrink-0" /> : <ChevronDown size={14} className="text-white/30 shrink-0" />}
            </div>

            {isOpen && (
              <div className="px-5 pb-4 pt-0 border-t border-white/[0.05] bg-white/[0.01]">
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1.5 text-xs text-white/50">
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <Globe size={11} />{new URL(lead.website).hostname.replace("www.", "")} <ExternalLink size={9} />
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
  );
}

function EmailsTab({
  emails, leads, expanded, setExpanded, generating, sending, onGenerate, onSendAll,
}: {
  emails: GeneratedEmail[];
  leads: Lead[];
  campaignId: string;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  generating: boolean;
  sending: boolean;
  onGenerate: () => void;
  onSendAll: () => void;
}) {
  const withEmailLeads = leads.filter((l) => l.email);
  const unsent = emails.filter((e) => !e.sent);

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={generating || withEmailLeads.length === 0}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          {generating ? <><Loader2 size={12} className="animate-spin" /> Generating…</> : <><Sparkles size={12} /> Generate Emails</>}
        </button>
        {emails.length > 0 && (
          <button
            onClick={onSendAll}
            disabled={sending || unsent.length === 0}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            {sending ? <><Loader2 size={12} className="animate-spin" /> Sending…</> : <><Send size={12} /> Send All ({unsent.length})</>}
          </button>
        )}
        {withEmailLeads.length === 0 && (
          <span className="text-xs text-white/30">No leads with email — run "Enrich Emails" in Lead Intelligence first.</span>
        )}
      </div>

      {emails.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Mail size={32} className="mx-auto mb-2 text-white/15" />
          <p className="text-white/50 text-sm">No emails generated yet. Click "Generate Emails" to create personalised outreach.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => {
            const isOpen = expanded === email.lead_id;
            return (
              <GlassCard key={email.lead_id} className="p-0 overflow-hidden">
                <div
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : email.lead_id)}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${email.sent ? "bg-success" : "bg-white/20"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{email.lead_name}</span>
                      {email.sent ? (
                        <span className="tag text-[9px] bg-success/15 border-success/35 text-success"><CheckCircle size={8} /> Sent</span>
                      ) : (
                        <span className="tag text-[9px] bg-white/5 border-white/15 text-white/40">Draft</span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-0.5 truncate">{email.subject}</p>
                  </div>
                  {email.sent_at && <span className="text-[10px] text-white/25"><Clock size={9} className="inline mr-1" />{timeAgo(email.sent_at)}</span>}
                  {isOpen ? <ChevronUp size={14} className="text-white/30 shrink-0" /> : <ChevronDown size={14} className="text-white/30 shrink-0" />}
                </div>
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-white/[0.05] bg-white/[0.01]">
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Subject</p>
                        <p className="text-sm text-white/80 font-semibold">{email.subject}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Body</p>
                        <pre className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)}
                        className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                      >
                        <Copy size={10} /> Copy
                      </button>
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

function WhatsAppTab({
  messages, leads, generating, onGenerate,
}: {
  messages: WhatsAppMessage[];
  leads: Lead[];
  generating: boolean;
  onGenerate: () => void;
}) {
  const withPhone = leads.filter((l) => l.phone);

  return (
    <div className="space-y-4">
      {/* Context card */}
      <GlassCard className="p-4 border-success/20 bg-success/[0.03]">
        <div className="flex items-start gap-3">
          <Zap size={16} className="text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-success mb-0.5">WhatsApp-first market</p>
            <p className="text-xs text-white/50 leading-relaxed">
              90%+ of UAE RE professionals communicate via WhatsApp. These short, plain-text messages are optimised for WhatsApp — under 100 words, no headers, conversational tone.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={generating || withPhone.length === 0}
          className="btn-success flex items-center gap-2 text-xs"
        >
          {generating
            ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
            : <><Sparkles size={12} /> Generate WA Messages</>}
        </button>
        {withPhone.length === 0 && (
          <span className="text-xs text-white/30">No leads with phone — scrape more leads to get phone numbers.</span>
        )}
      </div>

      {messages.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <MessageSquare size={32} className="mx-auto mb-2 text-white/15" />
          <p className="text-white/50 text-sm">No WhatsApp messages yet. Generate personalised openers for phone-verified leads.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <GlassCard key={msg.lead_id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-sm text-white">{msg.lead_name}</span>
                  <span className="text-xs text-white/35 ml-2">{msg.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.message)}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
                  >
                    <Copy size={9} /> Copy
                  </button>
                  <a
                    href={`https://wa.me/${msg.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg.message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-success text-xs flex items-center gap-1.5 py-1 px-2.5"
                  >
                    <ExternalLink size={9} /> Open WA
                  </a>
                </div>
              </div>
              <div className="bg-success/5 border border-success/15 rounded-xl p-3">
                <p className="text-sm text-white/80 leading-relaxed">{msg.message}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
