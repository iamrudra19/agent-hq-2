import { useEffect, useState, useMemo } from "react";
import {
  Plus, Search, Grid3x3, List, MapPin, BedDouble, Bath, Ruler,
  Clock, Home, Building2, Trees, Warehouse, X, Loader2, AlertCircle,
  ImageIcon, Trash2,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Property = {
  id: string;
  title: string;
  address: string;
  area: string;
  city: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  property_type: string;
  status: string;
  listing_type: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

const PROPERTY_TYPES = [
  { id: "Apartment", label: "Apartment", icon: Building2 },
  { id: "Villa", label: "Villa", icon: Home },
  { id: "Townhouse", label: "Townhouse", icon: Home },
  { id: "Penthouse", label: "Penthouse", icon: Building2 },
  { id: "Land", label: "Land", icon: Trees },
  { id: "Commercial", label: "Commercial", icon: Warehouse },
];

const STATUS_OPTIONS = ["Active", "Pending", "Sold", "Off-Market"];

const DUBAI_AREAS = [
  "Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "JVC", "JBR",
  "Business Bay", "DIFC", "Deira", "Bur Dubai", "Jumeirah", "Al Barsha",
  "Silicon Oasis", "Mirdif", "Arabian Ranches", "Sharjah", "Ajman",
];

const STATUS_STYLE: Record<string, string> = {
  Active: "bg-success/15 border-success/35 text-success",
  Pending: "bg-amber/15 border-amber/35 text-amber",
  Sold: "bg-white/8 border-white/20 text-white/50",
  "Off-Market": "bg-white/8 border-white/20 text-white/40",
};

export default function REProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000000);
  const [selectedBeds, setSelectedBeds] = useState<number | null>(null);
  const [selectedBaths, setSelectedBaths] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Active"]);
  const [selectedArea, setSelectedArea] = useState<string>("");

  async function load() {
    try {
      const list = await call<Property[]>("re.property.list").catch(() => []);
      setProperties(Array.isArray(list) ? list : []);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    let list = properties;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q) ||
        (p.area ?? "").toLowerCase().includes(q),
      );
    }
    list = list.filter((p) => (p.price ?? 0) >= minPrice && (p.price ?? 0) <= maxPrice);
    if (selectedBeds !== null) {
      list = list.filter((p) => (selectedBeds === 5 ? (p.bedrooms ?? 0) >= 5 : (p.bedrooms ?? 0) === selectedBeds));
    }
    if (selectedBaths !== null) {
      list = list.filter((p) => (selectedBaths === 4 ? (p.bathrooms ?? 0) >= 4 : (p.bathrooms ?? 0) === selectedBaths));
    }
    if (selectedTypes.length > 0) {
      list = list.filter((p) => selectedTypes.includes(p.property_type));
    }
    if (selectedStatuses.length > 0) {
      list = list.filter((p) => selectedStatuses.includes(p.status));
    }
    if (selectedArea) {
      list = list.filter((p) => p.area === selectedArea);
    }
    return list;
  }, [properties, search, minPrice, maxPrice, selectedBeds, selectedBaths, selectedTypes, selectedStatuses, selectedArea]);

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter((p) => p.status === "Active").length,
    avgPrice: properties.length
      ? Math.round(properties.reduce((s, p) => s + (p.price ?? 0), 0) / properties.length)
      : 0,
    totalValue: properties.filter((p) => p.status === "Active").reduce((s, p) => s + (p.price ?? 0), 0),
  }), [properties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-2xl">Properties</h1>
          <p className="text-white/50 text-sm mt-1">Your listing inventory · Dubai & UAE</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-xs">
          <Plus size={13} /> Add Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Listings" value={stats.total} color="text-white" />
        <StatCard label="Active" value={stats.active} color="text-success" />
        <StatCard label="Avg. Price" prefix="AED " value={stats.avgPrice} color="text-primary" />
        <StatCard label="Portfolio Value" prefix="AED " value={stats.totalValue} color="text-accent" />
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* Filters sidebar */}
        <GlassCard className="p-5 space-y-5 h-fit sticky top-4">
          <div>
            <p className="font-display font-bold text-sm text-white/80 mb-3 tracking-widest uppercase">Filters</p>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Price (AED)</label>
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={20000000}
                step={100000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-white/40">
                <span>AED 0</span>
                <span className="text-primary font-bold">AED {maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Bedrooms</label>
            <div className="flex flex-wrap gap-1.5">
              <PillButton active={selectedBeds === null} onClick={() => setSelectedBeds(null)}>Any</PillButton>
              {[1, 2, 3, 4, 5].map((n) => (
                <PillButton key={n} active={selectedBeds === n} onClick={() => setSelectedBeds(n)}>{n === 5 ? "5+" : n}</PillButton>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Bathrooms</label>
            <div className="flex flex-wrap gap-1.5">
              <PillButton active={selectedBaths === null} onClick={() => setSelectedBaths(null)}>Any</PillButton>
              {[1, 2, 3, 4].map((n) => (
                <PillButton key={n} active={selectedBaths === n} onClick={() => setSelectedBaths(n)}>{n === 4 ? "4+" : n}</PillButton>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Property Type</label>
            <div className="space-y-1.5">
              {PROPERTY_TYPES.map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t.id)}
                    onChange={(e) => setSelectedTypes(e.target.checked
                      ? [...selectedTypes, t.id]
                      : selectedTypes.filter((x) => x !== t.id))}
                    className="w-3 h-3 accent-primary"
                  />
                  <t.icon size={11} className="text-white/40 group-hover:text-primary transition-colors" />
                  <span className="text-xs text-white/70 group-hover:text-white transition-colors">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Status</label>
            <div className="space-y-1.5">
              {STATUS_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(s)}
                    onChange={(e) => setSelectedStatuses(e.target.checked
                      ? [...selectedStatuses, s]
                      : selectedStatuses.filter((x) => x !== s))}
                    className="w-3 h-3 accent-primary"
                  />
                  <span className="text-xs text-white/70">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2 block">Area</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">All areas</option>
              {DUBAI_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <button
            onClick={() => {
              setSearch(""); setMinPrice(0); setMaxPrice(20000000);
              setSelectedBeds(null); setSelectedBaths(null);
              setSelectedTypes([]); setSelectedStatuses(["Active"]); setSelectedArea("");
            }}
            className="w-full btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </GlassCard>

        {/* Property list */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search address, title, or area…"
                className="input-field pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 glass px-1 py-1 rounded-lg">
              <button
                onClick={() => setView("grid")}
                className={`px-2 py-1.5 rounded transition-colors ${view === "grid" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/70"}`}
              >
                <Grid3x3 size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-2 py-1.5 rounded transition-colors ${view === "list" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/70"}`}
              >
                <List size={13} />
              </button>
            </div>
            <span className="text-xs text-white/40">{filtered.length} of {properties.length}</span>
          </div>

          {!loaded && (
            <GlassCard className="p-10 text-center">
              <div className="text-white/30 text-sm">Loading properties…</div>
            </GlassCard>
          )}

          {loaded && properties.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Home size={40} className="mx-auto mb-3 text-white/15" />
              <p className="font-semibold text-white/60 mb-1">No listings yet</p>
              <p className="text-white/40 text-sm mb-4">Add your first property to start building your Dubai inventory.</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-2 mx-auto">
                <Plus size={14} /> Add Property
              </button>
            </GlassCard>
          )}

          {loaded && properties.length > 0 && filtered.length === 0 && (
            <GlassCard className="p-10 text-center">
              <p className="text-white/40 text-sm">No properties match your filters.</p>
            </GlassCard>
          )}

          {view === "grid" && filtered.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((p) => <PropertyCard key={p.id} property={p} onDelete={load} />)}
            </div>
          )}

          {view === "list" && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((p) => <PropertyRow key={p.id} property={p} onDelete={load} />)}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddPropertyModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); void load(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, color, prefix }: { label: string; value: number; color: string; prefix?: string }) {
  return (
    <GlassCard className="p-4">
      <div className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-display font-bold ${color}`}>
        {prefix ?? ""}<AnimatedNumber value={value} />
      </div>
    </GlassCard>
  );
}

function PillButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
        active ? "bg-primary/20 border-primary/40 text-primary" : "bg-transparent border-white/10 text-white/50 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function PropertyCard({ property, onDelete }: { property: Property; onDelete: () => void }) {
  const psf = property.sqft > 0 ? Math.round((property.price ?? 0) / property.sqft) : 0;
  const daysOnMarket = Math.floor((Date.now() - new Date(property.created_at ?? Date.now()).getTime()) / (1000 * 60 * 60 * 24));
  return (
    <GlassCard className="p-0 overflow-hidden hover:border-white/20 transition-colors" hover>
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-purple/10 flex items-center justify-center relative">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <ImageIcon size={32} className="text-white/15" />
        )}
        <span className={`absolute top-2 right-2 tag text-[9px] ${STATUS_STYLE[property.status] ?? "bg-white/10 text-white/40"}`}>
          {property.status}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="text-lg font-display font-bold text-white">
              {property.currency ?? "AED"} {(property.price ?? 0).toLocaleString()}
            </div>
            {psf > 0 && <div className="text-[10px] text-white/40">AED {psf.toLocaleString()}/sqft</div>}
          </div>
          <span className="tag text-[9px] bg-white/5 border-white/15 text-white/60">{property.property_type}</span>
        </div>
        <p className="font-bold text-sm text-white truncate">{property.title || property.address}</p>
        <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5 truncate">
          <MapPin size={10} />{property.area}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-white/60 pt-3 border-t border-white/[0.06]">
          <span className="flex items-center gap-1"><BedDouble size={11} />{property.bedrooms ?? 0}</span>
          <span className="flex items-center gap-1"><Bath size={11} />{property.bathrooms ?? 0}</span>
          <span className="flex items-center gap-1"><Ruler size={11} />{(property.sqft ?? 0).toLocaleString()} sqft</span>
          <span className="ml-auto flex items-center gap-1 text-white/30 text-[10px]"><Clock size={9} />{daysOnMarket}d</span>
        </div>
      </div>
    </GlassCard>
  );
}

function PropertyRow({ property, onDelete }: { property: Property; onDelete: () => void }) {
  const psf = property.sqft > 0 ? Math.round((property.price ?? 0) / property.sqft) : 0;
  async function del() {
    if (!confirm(`Delete "${property.title}"?`)) return;
    await call("re.property.delete", { id: property.id }).catch(() => {});
    onDelete();
  }
  return (
    <GlassCard className="p-4 flex items-center gap-4 hover:border-white/15 transition-colors">
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-purple/10 flex items-center justify-center shrink-0">
        <ImageIcon size={18} className="text-white/20" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-white">{property.title}</span>
          <span className={`tag text-[9px] ${STATUS_STYLE[property.status] ?? "bg-white/10 text-white/40"}`}>{property.status}</span>
          <span className="tag text-[9px] bg-white/5 border-white/15 text-white/60">{property.property_type}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
          <MapPin size={10} /><span>{property.area}, {property.city}</span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-5 text-xs text-white/60 shrink-0">
        <span className="flex items-center gap-1"><BedDouble size={11} />{property.bedrooms ?? 0}</span>
        <span className="flex items-center gap-1"><Bath size={11} />{property.bathrooms ?? 0}</span>
        <span className="flex items-center gap-1"><Ruler size={11} />{(property.sqft ?? 0).toLocaleString()}</span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-lg font-display font-bold text-white">{property.currency ?? "AED"} {(property.price ?? 0).toLocaleString()}</div>
        {psf > 0 && <div className="text-[10px] text-white/40">AED {psf.toLocaleString()}/sqft</div>}
      </div>
      <button onClick={del} className="text-white/30 hover:text-danger transition-colors p-1"><Trash2 size={13} /></button>
    </GlassCard>
  );
}

function AddPropertyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [type, setType] = useState("Apartment");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || !price) { setError("Title and price are required."); return; }
    setSaving(true); setError(null);
    try {
      await call("re.property.create", {
        title: title.trim(),
        address: address.trim(),
        area,
        city: "Dubai",
        price: parseFloat(price.replace(/[^0-9.]/g, "")) || 0,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseFloat(bathrooms) || 0,
        sqft: parseInt(sqft) || 0,
        property_type: type,
        status,
        description: description.trim(),
        image_url: image.trim(),
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <h2 className="font-display font-bold text-base text-white">Add Property</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. 3BR Marina View Apartment" />
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="Building name, street" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Area</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field">
                <option value="">Select area…</option>
                {DUBAI_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Price (AED) *</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="1,500,000" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Bedrooms</label>
              <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="input-field" placeholder="3" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Bathrooms</label>
              <input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="input-field" placeholder="2.5" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Sqft</label>
              <input value={sqft} onChange={(e) => setSqft(e.target.value)} className="input-field" placeholder="1,800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                {PROPERTY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Image URL (optional)</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} className="input-field" placeholder="https://…" />
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="Sea view, marble floors, upgraded kitchen…" />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-lg text-xs text-danger">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-white/[0.06] shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
          <button onClick={save} disabled={saving || !title.trim() || !price} className="btn-primary text-sm flex-1 flex items-center gap-2 justify-center">
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Add Property"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
