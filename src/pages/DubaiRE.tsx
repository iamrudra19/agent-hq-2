import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Target,
  Search,
  MapPin,
  Trash2,
  AlertCircle,
  Mail,
  MessageSquare,
  TrendingUp,
  Zap,
  Globe,
  ChevronRight,
  Building2,
  Users,
  BarChart3,
  CheckCircle2,
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

type IcpTemplate = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  query: string;
  structured_query: { location: string; searchTerms: string[]; maxResults: number };
  pain_points: string[];
};

type StructuredQuery = { location: string; searchTerms: string[]; maxResults: number };

type ConfigStatus = Record<string, { configured: boolean }>;

const STATUS_COLORS: Record<Campaign["status"], string> = {
  draft: "bg-white/10 border-white/20 text-white/70",
  searching: "bg-primary/15 border-primary/40 text-primary",
  ready: "bg-accent/15 border-accent/40 text-accent",
  sending: "bg-purple/15 border-purple/40 text-purple",
  completed: "bg-green-500/15 border-green-500/40 text-green-300",
  failed: "bg-red-500/15 border-red-500/40 text-red-300",
};

const MARKET_STATS = [
  { label: "Dubai RE Transactions (2025)", value: "AED 760B+", sub: "30.6% YoY growth", icon: TrendingUp, color: "text-accent" },
  { label: "WhatsApp Communication Share", value: "90%+", sub: "of all RE conversations", icon: MessageSquare, color: "text-green-400" },
  { label: "WhatsApp Conversion Rate", value: "25–35%", sub: "vs 1–3% for paid leads", icon: Zap, color: "text-purple" },
  { label: "UAE PropTech CAGR to 2030", value: "17%+", sub: "AED 2.24B → AED 5.69B", icon: BarChart3, color: "text-primary" },
];

export default function DubaiRE() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<IcpTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const [list, cfg, tmpl] = await Promise.all([
        call<Campaign[]>("outreach.campaign.list"),
        call<ConfigStatus>("config.status"),
        call<IcpTemplate[]>("re.icp.templates"),
      ]);
      setCampaigns(list);
      setConfig(cfg);
      setTemplates(tmpl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoaded(true);
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await call("outreach.campaign.delete", { id });
      await refresh();
    } finally {
      setDeleting(null);
    }
  }

  const missingKeys = config ? ["gemini", "apify", "agentmail"].filter((k) => !config[k]?.configured) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dubai RE SDR"
        subtitle="AI-powered outreach for UAE real estate brokerages"
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setWizardOpen(true)}
          >
            <Plus size={16} />
            New Campaign
          </button>
        }
      />

      {/* Market Stats Banner */}
      <div className="grid grid-cols-4 gap-4">
        {MARKET_STATS.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <stat.icon size={18} className={stat.color} />
            </div>
            <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm font-semibold text-white mt-0.5">{stat.label}</div>
            <div className="text-xs text-white/50 mt-0.5">{stat.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Missing keys warning */}
      {loaded && missingKeys.length > 0 && (
        <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">API keys required</p>
              <p className="text-xs text-white/60 mt-0.5">
                Configure {missingKeys.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(", ")} in{" "}
                <Link to="/integrations" className="text-primary hover:underline">Integrations</Link> before running campaigns.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {err && (
        <GlassCard className="p-4 border-red-500/30">
          <p className="text-sm text-red-300">{err}</p>
        </GlassCard>
      )}

      {/* ICP Templates */}
      {!wizardOpen && templates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-display font-bold tracking-wide">Quick-Start ICP Templates</h2>
              <p className="text-xs text-white/50 mt-0.5">Pre-built for Dubai RE market segments. Click any to launch a campaign.</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setWizardOpen(true)}
                className="glass p-4 text-left rounded-xl border border-white/[0.08] hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="text-2xl mb-2">{tmpl.emoji}</div>
                <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{tmpl.label}</div>
                <div className="text-xs text-white/50 mt-1 leading-relaxed">{tmpl.description}</div>
                <div className="mt-3 space-y-1">
                  {tmpl.pain_points.slice(0, 2).map((p) => (
                    <div key={p} className="text-[10px] text-white/40 flex items-start gap-1">
                      <span className="text-accent mt-0.5">•</span> {p}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-primary/70 group-hover:text-primary flex items-center gap-1 transition-colors">
                  Use this template <ChevronRight size={12} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Wizard */}
      {wizardOpen && (
        <RECampaignWizard
          templates={templates}
          onClose={() => setWizardOpen(false)}
          onCreated={async () => {
            setWizardOpen(false);
            await refresh();
          }}
        />
      )}

      {/* Campaign List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-display font-bold tracking-wide">
            Campaigns {campaigns.length > 0 && <span className="text-white/40 font-normal ml-1">({campaigns.length})</span>}
          </h2>
        </div>

        {!loaded && (
          <GlassCard className="p-8 flex items-center justify-center">
            <div className="text-white/40 text-sm">Loading campaigns…</div>
          </GlassCard>
        )}

        {loaded && campaigns.length === 0 && !wizardOpen && (
          <GlassCard className="p-10 text-center">
            <Building2 size={40} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/60 font-semibold mb-1">No campaigns yet</p>
            <p className="text-white/40 text-sm mb-4">Choose an ICP template above or create a custom campaign.</p>
            <button className="btn-primary text-sm" onClick={() => setWizardOpen(true)}>
              <Plus size={14} className="inline mr-1" /> New Campaign
            </button>
          </GlassCard>
        )}

        {loaded && campaigns.length > 0 && (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <GlassCard key={c.id} className="p-5 hover:border-white/15 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${STATUS_COLORS[c.status]}`}
                      >
                        {c.status}
                      </span>
                      <h3 className="font-semibold text-white truncate">{c.name}</h3>
                    </div>
                    {c.structured_query && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/50">
                        <MapPin size={12} />
                        <span>{c.structured_query.location}</span>
                        <span className="text-white/25">·</span>
                        <span>{c.structured_query.searchTerms.slice(0, 2).join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <Stat icon={Users} value={c.leads_imported} label="leads" />
                      <Stat icon={Mail} value={c.emails_sent} label="sent" />
                      <Stat icon={MessageSquare} value={c.emails_replied} label="replied" color={c.emails_replied > 0 ? "text-accent" : undefined} />
                      {c.emails_bounced > 0 && (
                        <Stat icon={AlertCircle} value={c.emails_bounced} label="bounced" color="text-red-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-white/30">{timeAgo(c.updated_at)}</span>
                    <Link
                      to={`/re/${c.id}`}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      Open <ChevronRight size={13} />
                    </Link>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      disabled={deleting === c.id}
                      className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Why Proxim insight block */}
      <GlassCard className="p-6 border-white/[0.06]">
        <h3 className="text-sm font-display font-bold tracking-widest uppercase text-white/50 mb-4">Market Intelligence</h3>
        <div className="grid grid-cols-3 gap-6">
          <InsightBlock
            icon="⚡"
            title="Speed = Closed Deals"
            body="UAE RE agencies that respond to portal leads within 60 seconds close significantly more deals. Most SMBs take 4+ hours. AI bridges this gap."
          />
          <InsightBlock
            icon="🌍"
            title="Multilingual Gap"
            body="200+ nationalities in Dubai. 60%+ Arabic-speaking market is systematically underserved by English-only brokerage operations."
          />
          <InsightBlock
            icon="📱"
            title="WhatsApp-First Market"
            body="90%+ of all UAE real estate communication happens on WhatsApp. 80% of agents' best conversions come from WhatsApp leads, not portals or email."
          />
        </div>
      </GlassCard>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.FC<{ size?: number; className?: string }>;
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className={color ?? "text-white/30"} />
      <span className={`text-sm font-semibold ${color ?? "text-white/70"}`}>
        <AnimatedNumber value={value} />
      </span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  );
}

function InsightBlock({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold text-white mb-1">{title}</div>
      <div className="text-xs text-white/50 leading-relaxed">{body}</div>
    </div>
  );
}

// ── Campaign Wizard ────────────────────────────────────────────────

type WizardStep = "template" | "customize" | "preview" | "confirm";

function RECampaignWizard({
  templates,
  onClose,
  onCreated,
}: {
  templates: IcpTemplate[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [step, setStep] = useState<WizardStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<IcpTemplate | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [maxResults, setMaxResults] = useState(80);
  const [previewResult, setPreviewResult] = useState<StructuredQuery | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const effectiveQuery = selectedTemplate ? selectedTemplate.query : customQuery;

  async function runPreview() {
    setErr(null);
    setPreviewing(true);
    try {
      if (selectedTemplate) {
        setPreviewResult({ ...selectedTemplate.structured_query, maxResults });
      } else {
        const result = await call<StructuredQuery>("re.icp.preview", { query: customQuery, max_results: maxResults });
        setPreviewResult(result);
      }
      setStep("preview");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function createCampaign() {
    if (!previewResult || !campaignName.trim()) return;
    setCreating(true);
    setErr(null);
    try {
      const campaign = await call<{ id: string }>("outreach.campaign.create", {
        name: campaignName.trim(),
        query: effectiveQuery,
        description: selectedTemplate ? `Template: ${selectedTemplate.label}` : undefined,
        structured_query: previewResult,
      });
      await call("outreach.campaign.run", { id: campaign.id });
      await onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  return (
    <GlassCard className="p-6 border-primary/30">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-base tracking-wide">New Outreach Campaign</h2>
          <p className="text-xs text-white/50 mt-0.5">Dubai RE prospects · AI-personalized outreach</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none transition-colors">
          ×
        </button>
      </div>

      {err && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
          {err}
        </div>
      )}

      {/* Step 1: Template selection */}
      {(step === "template" || step === "customize") && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              Choose ICP Template or Enter Custom
            </label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl === selectedTemplate ? null : tmpl);
                    setStep("customize");
                    if (!campaignName) setCampaignName(tmpl.label);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplate?.id === tmpl.id
                      ? "border-primary/60 bg-primary/10 shadow-glow"
                      : "border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <div className="text-lg mb-1">{tmpl.emoji}</div>
                  <div className="text-xs font-semibold text-white leading-tight">{tmpl.label}</div>
                </button>
              ))}
            </div>

            {!selectedTemplate && (
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Custom ICP Description
                </label>
                <textarea
                  value={customQuery}
                  onChange={(e) => { setCustomQuery(e.target.value); setStep("customize"); }}
                  placeholder="e.g. Real estate agencies in JLT specialising in commercial leasing for corporate tenants"
                  className="input-field w-full h-20 resize-none text-sm"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Campaign Name
              </label>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Dubai Marina Luxury Brokers — June"
                className="input-field w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Max Leads to Scrape
              </label>
              <input
                type="number"
                value={maxResults}
                min={20}
                max={200}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="input-field w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={runPreview}
              disabled={previewing || (!selectedTemplate && !customQuery.trim()) || !campaignName.trim()}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Search size={14} />
              {previewing ? "Parsing ICP…" : "Preview Search"}
            </button>
            <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && previewResult && (
        <div className="space-y-5">
          <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-accent" />
              <span className="text-sm font-semibold text-accent">Search Query Ready</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-white/40 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Location</div>
                  <div className="text-sm text-white">{previewResult.location}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Search size={14} className="text-white/40 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Search Terms</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {previewResult.searchTerms.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-white/[0.06] border border-white/10 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-white/40 shrink-0" />
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider mr-2">Max Results</span>
                  <span className="text-sm text-white">{previewResult.maxResults}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-300/80">
              This will start an Apify Google Maps scrape for Dubai RE leads. Typical cost: $0.01–0.05/result via your Apify account.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={createCampaign}
              disabled={creating}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Zap size={14} />
              {creating ? "Launching Scrape…" : "Launch Campaign"}
            </button>
            <button onClick={() => setStep("customize")} className="btn-secondary text-sm">
              Back
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
