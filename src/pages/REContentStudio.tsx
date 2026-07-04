import { useEffect, useState, useMemo } from "react";
import {
  Sparkles, ImageIcon, Video, Calendar, Instagram, Facebook,
  Linkedin, Twitter, Copy, RefreshCw, X, Loader2, AlertCircle,
  Zap, TrendingUp, Hash, Trash2, ChevronDown,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type ContentPost = {
  id: string;
  kind: string;
  platform: string;
  niche: string;
  topic: string;
  property_id: string | null;
  caption: string;
  hashtags: string[];
  call_to_action: string;
  image_prompts: string[];
  status: string;
  created_at: string;
};

type Property = {
  id: string;
  title: string;
  area: string;
  price: number;
  currency: string;
  bedrooms: number;
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-400" },
  { id: "twitter", label: "X/Twitter", icon: Twitter, color: "text-white/80" },
];

const NICHES = [
  { id: "luxury", label: "Luxury Residential" },
  { id: "investment", label: "Investment / Off-Plan" },
  { id: "commercial", label: "Commercial" },
  { id: "affordable", label: "Affordable / Mid-Market" },
  { id: "consulting", label: "Consulting / Advisory" },
  { id: "property_management", label: "Property Management" },
];

const TOPICS = [
  "New listing announcement",
  "Market update — Dubai 2026",
  "Investor spotlight — ROI insights",
  "Neighborhood highlight",
  "Off-plan launch teaser",
  "Client success story",
  "First-time buyer tips",
  "Golden Visa & residency angle",
  "Weekend open house",
  "Rental yield calculator",
];

const TONE_OPTIONS = [
  { id: "professional", label: "Professional" },
  { id: "aspirational", label: "Aspirational / Luxury" },
  { id: "friendly", label: "Friendly / Conversational" },
  { id: "authoritative", label: "Authoritative / Data-driven" },
];

type Tab = "generate" | "posts" | "images" | "calendar";

export default function REContentStudio() {
  const [tab, setTab] = useState<Tab>("generate");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  async function load() {
    const [p, pr] = await Promise.all([
      call<ContentPost[]>("re.content.list").catch(() => []),
      call<Property[]>("re.property.list").catch(() => []),
    ]);
    setPosts(Array.isArray(p) ? p : []);
    setProperties(Array.isArray(pr) ? pr : []);
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    return {
      total: posts.length,
      thisMonth: posts.filter((p) => new Date(p.created_at) >= thisMonth).length,
      images: posts.filter((p) => (p.image_prompts?.length ?? 0) > 0).length,
      byPlatform: PLATFORMS.map((pl) => ({
        ...pl,
        count: posts.filter((p) => p.platform === pl.id).length,
      })),
    };
  }, [posts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title text-2xl">Content Studio</h1>
        <p className="text-white/50 text-sm mt-1">AI-generated social posts, image prompts, and content calendar for your Dubai listings</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-4 gap-3">
        <FeatureCard icon={Sparkles} label="AI Social Post" sub="Captions & hashtags" active={tab === "generate"} onClick={() => setTab("generate")} color="primary" />
        <FeatureCard icon={ImageIcon} label="AI Image Prompts" sub="For Midjourney/DALL-E" active={tab === "images"} onClick={() => setTab("images")} color="purple" />
        <FeatureCard icon={Video} label="Post Library" sub={`${posts.length} generated`} active={tab === "posts"} onClick={() => setTab("posts")} color="success" />
        <FeatureCard icon={Calendar} label="Content Calendar" sub="Plan schedule" active={tab === "calendar"} onClick={() => setTab("calendar")} color="accent" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={13} className="text-primary" />
            <span className="text-xs text-white/40 font-semibold uppercase tracking-wide">Posts This Month</span>
          </div>
          <div className="text-2xl font-display font-bold text-white"><AnimatedNumber value={stats.thisMonth} /></div>
          <div className="text-[10px] text-success mt-1">+{stats.thisMonth} generated</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={13} className="text-purple" />
            <span className="text-xs text-white/40 font-semibold uppercase tracking-wide">AI Image Sets</span>
          </div>
          <div className="text-2xl font-display font-bold text-white"><AnimatedNumber value={stats.images} /></div>
          <div className="text-[10px] text-white/40 mt-1">Prompt bundles ready</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-success" />
            <span className="text-xs text-white/40 font-semibold uppercase tracking-wide">Total Content</span>
          </div>
          <div className="text-2xl font-display font-bold text-white"><AnimatedNumber value={stats.total} /></div>
          <div className="flex gap-2 mt-1">
            {stats.byPlatform.filter((p) => p.count > 0).map((p) => (
              <span key={p.id} className="text-[10px] text-white/40 flex items-center gap-0.5">
                <p.icon size={9} className={p.color} />{p.count}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {tab === "generate" && <GenerateTab properties={properties} onCreated={load} />}
      {tab === "images" && <ImagesTab properties={properties} onCreated={load} posts={posts.filter((p) => p.kind === "image_prompt")} />}
      {tab === "posts" && <PostsLibrary posts={posts.filter((p) => p.kind === "social_post")} onDelete={load} />}
      {tab === "calendar" && <CalendarTab posts={posts} />}
    </div>
  );
}

function FeatureCard({ icon: Icon, label, sub, active, onClick, color }: {
  icon: React.ElementType<any>; label: string; sub: string; active: boolean; onClick: () => void; color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: active ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-white/60 hover:border-primary/30",
    purple: active ? "border-purple/50 bg-purple/10 text-purple" : "border-white/10 text-white/60 hover:border-purple/30",
    success: active ? "border-success/50 bg-success/10 text-success" : "border-white/10 text-white/60 hover:border-success/30",
    accent: active ? "border-accent/50 bg-accent/10 text-accent" : "border-white/10 text-white/60 hover:border-accent/30",
  };
  return (
    <button onClick={onClick} className={`glass p-4 rounded-2xl border transition-all text-left ${colorMap[color]}`}>
      <Icon size={20} className="mb-2.5" />
      <div className="font-bold text-sm text-white">{label}</div>
      <div className="text-xs text-white/40 mt-0.5">{sub}</div>
    </button>
  );
}

function GenerateTab({ properties, onCreated }: { properties: Property[]; onCreated: () => void }) {
  const [platform, setPlatform] = useState("instagram");
  const [niche, setNiche] = useState("luxury");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [propertyId, setPropertyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ContentPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true); setError(null); setResult(null);
    try {
      const post = await call<ContentPost>("re.content.generate", {
        kind: "social_post",
        platform,
        niche,
        topic: customTopic.trim() || topic,
        tone,
        length,
        property_id: propertyId || undefined,
      });
      setResult(post);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Check Gemini key in Integrations.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Config panel */}
      <GlassCard className="p-5 space-y-4">
        <p className="font-display font-bold text-sm text-white/80 tracking-widest uppercase">Configure Post</p>

        <div>
          <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Platform</label>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  platform === p.id ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/25"
                }`}
              >
                <p.icon size={14} className={p.color} />
                <span className="text-[10px] font-bold text-white/70">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Niche</label>
          <select value={niche} onChange={(e) => setNiche(e.target.value)} className="input-field text-sm">
            {NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Topic Template</label>
          <select value={topic} onChange={(e) => { setTopic(e.target.value); setCustomTopic(""); }} className="input-field text-sm">
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Custom Topic (optional)</label>
          <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} className="input-field text-sm" placeholder="Overrides template" />
        </div>

        {properties.length > 0 && (
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Attach Property (optional)</label>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="input-field text-sm">
              <option value="">No specific property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.currency} {p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field text-sm">
              {TONE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Length</label>
            <select value={length} onChange={(e) => setLength(e.target.value as any)} className="input-field text-sm">
              <option value="short">Short (50-80w)</option>
              <option value="medium">Medium (100-150w)</option>
              <option value="long">Long (180-250w)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-lg text-xs text-danger">
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <button onClick={generate} disabled={generating} className="btn-primary w-full flex items-center gap-2 justify-center text-sm">
          {generating ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><Sparkles size={13} /> Generate Post</>}
        </button>
      </GlassCard>

      {/* Result panel */}
      <GlassCard className="p-5">
        {!result && !generating && (
          <div className="text-center py-16">
            <Sparkles size={36} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/50 text-sm">Configure your post and click Generate to see AI output</p>
          </div>
        )}
        {generating && (
          <div className="text-center py-16">
            <Loader2 size={28} className="mx-auto mb-3 text-primary animate-spin" />
            <p className="text-white/50 text-sm">Gemini is crafting your post…</p>
          </div>
        )}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-sm text-white/80 tracking-widest uppercase">Generated</p>
              <button onClick={() => navigator.clipboard.writeText(`${result.caption}\n\n${result.hashtags.join(" ")}`)} className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5">
                <Copy size={10} /> Copy all
              </button>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">{result.caption}</p>
            </div>
            {result.hashtags.length > 0 && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1"><Hash size={10} /> Hashtags</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((h) => (
                    <span key={h} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-primary/80 border border-primary/20">{h}</span>
                  ))}
                </div>
              </div>
            )}
            {result.call_to_action && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Call to Action</p>
                <p className="text-sm text-accent">{result.call_to_action}</p>
              </div>
            )}
            <button onClick={generate} className="btn-secondary text-xs w-full flex items-center gap-2 justify-center">
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ImagesTab({ properties, onCreated, posts }: { properties: Property[]; onCreated: () => void; posts: ContentPost[] }) {
  const [propertyId, setPropertyId] = useState("");
  const [topic, setTopic] = useState("Luxury Dubai Marina apartment interior at golden hour");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ContentPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true); setError(null); setResult(null);
    try {
      const post = await call<ContentPost>("re.content.generate", {
        kind: "image_prompt",
        platform: "instagram",
        topic,
        property_id: propertyId || undefined,
      });
      setResult(post);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <GlassCard className="p-5 space-y-4">
          <p className="font-display font-bold text-sm text-white/80 tracking-widest uppercase">AI Image Prompt Generator</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Generate 3 cinematic image prompts optimised for Midjourney or DALL-E to create stunning property photography.
          </p>
          {properties.length > 0 && (
            <div>
              <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Attach Property</label>
              <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="input-field text-sm">
                <option value="">Freeform (no property)</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Scene Description</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} className="input-field text-sm resize-none" />
          </div>
          {error && <div className="text-xs text-danger">{error}</div>}
          <button onClick={generate} disabled={generating} className="btn-primary w-full flex items-center gap-2 justify-center text-sm">
            {generating ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><Sparkles size={13} /> Generate 3 Prompts</>}
          </button>
        </GlassCard>

        <GlassCard className="p-5">
          {!result && (
            <div className="text-center py-16">
              <ImageIcon size={36} className="mx-auto mb-3 text-white/15" />
              <p className="text-white/50 text-sm">Prompts will appear here</p>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              <p className="font-display font-bold text-sm text-white/80 tracking-widest uppercase">Prompts Ready</p>
              {result.image_prompts.map((prompt, i) => (
                <div key={i} className="bg-purple/5 border border-purple/20 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] text-purple font-bold uppercase tracking-wider">Prompt {i + 1}</span>
                    <button onClick={() => navigator.clipboard.writeText(prompt)} className="text-white/30 hover:text-white/70">
                      <Copy size={10} />
                    </button>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{prompt}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {posts.length > 0 && (
        <div>
          <p className="font-display font-bold text-xs text-white/60 tracking-widest uppercase mb-3">Recent Prompt Sets</p>
          <div className="grid grid-cols-2 gap-3">
            {posts.slice(0, 6).map((p) => (
              <GlassCard key={p.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white/70 truncate">{p.topic}</span>
                  <span className="text-[10px] text-white/30">{timeAgo(p.created_at)}</span>
                </div>
                <div className="text-[10px] text-white/40 line-clamp-2">{p.image_prompts[0]}</div>
                <div className="text-[10px] text-purple mt-1">{p.image_prompts.length} prompts</div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostsLibrary({ posts, onDelete }: { posts: ContentPost[]; onDelete: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>("all");

  const filtered = platform === "all" ? posts : posts.filter((p) => p.platform === platform);

  async function del(id: string) {
    if (!confirm("Delete this post?")) return;
    await call("re.content.delete", { id }).catch(() => {});
    onDelete();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setPlatform("all")} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${platform === "all" ? "bg-primary/15 border-primary/35 text-primary" : "bg-transparent border-white/10 text-white/40"}`}>All ({posts.length})</button>
        {PLATFORMS.map((pl) => {
          const cnt = posts.filter((p) => p.platform === pl.id).length;
          if (cnt === 0) return null;
          return (
            <button key={pl.id} onClick={() => setPlatform(pl.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${platform === pl.id ? "bg-primary/15 border-primary/35 text-primary" : "bg-transparent border-white/10 text-white/40"}`}>
              <pl.icon size={10} className={pl.color} /> {pl.label} ({cnt})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-white/40 text-sm">No posts yet. Generate your first one from the "AI Social Post" tab.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const pl = PLATFORMS.find((x) => x.id === p.platform);
            const isOpen = expanded === p.id;
            return (
              <GlassCard key={p.id} className="p-0 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(isOpen ? null : p.id)}>
                  {pl && <pl.icon size={14} className={pl.color} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">{p.topic || "Untitled"}</span>
                      <span className="tag text-[9px] bg-white/5 border-white/15 text-white/50">{p.niche}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{p.caption?.slice(0, 80)}…</p>
                  </div>
                  <span className="text-[10px] text-white/25">{timeAgo(p.created_at)}</span>
                  <ChevronDown size={14} className={`text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-white/[0.05] bg-white/[0.01]">
                    <div className="mt-3 space-y-3">
                      <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                        <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{p.caption}</p>
                      </div>
                      {p.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.hashtags.map((h) => <span key={h} className="text-[10px] px-2 py-0.5 bg-primary/10 rounded-full text-primary/80 border border-primary/20">{h}</span>)}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigator.clipboard.writeText(`${p.caption}\n\n${p.hashtags.join(" ")}`)} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                          <Copy size={10} /> Copy
                        </button>
                        <button onClick={() => del(p.id)} className="text-danger/70 hover:text-danger text-xs flex items-center gap-1.5 py-1.5 px-3">
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
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

function CalendarTab({ posts }: { posts: ContentPost[] }) {
  // Group by week
  const now = new Date();
  const weeks: Array<{ label: string; posts: ContentPost[] }> = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() - 6);
    const bucket = posts.filter((p) => {
      const d = new Date(p.created_at);
      return d <= start && d > end;
    });
    weeks.push({
      label: i === 0 ? "This week" : i === 1 ? "Last week" : `${i} weeks ago`,
      posts: bucket,
    });
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 border-primary/20 bg-primary/[0.03]">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          <p className="text-sm text-white/70">Content calendar shows what you've generated over the last 4 weeks. Schedule integrations (Buffer / Meta / LinkedIn) coming soon.</p>
        </div>
      </GlassCard>

      {weeks.map((w) => (
        <div key={w.label}>
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">{w.label} — {w.posts.length} posts</p>
          {w.posts.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-xs text-white/25">No content generated</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {w.posts.map((p) => {
                const pl = PLATFORMS.find((x) => x.id === p.platform);
                return (
                  <GlassCard key={p.id} className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {pl && <pl.icon size={11} className={pl.color} />}
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">{p.niche}</span>
                    </div>
                    <p className="text-xs text-white/70 line-clamp-2">{p.caption?.slice(0, 100)}</p>
                    <span className="text-[9px] text-white/25 mt-1 block">{timeAgo(p.created_at)}</span>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
