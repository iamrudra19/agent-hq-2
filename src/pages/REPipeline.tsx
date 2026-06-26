import { useEffect, useState } from "react";
import {
  Plus, DollarSign, Users, Kanban, ChevronRight,
  Phone, Mail, MapPin, X, Loader2, AlertCircle, Clock,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "doing" | "needs_input" | "done";
  metadata?: {
    phone?: string;
    email?: string;
    area?: string;
    property_type?: string;
    estimated_value?: string;
    source?: string;
  };
  created_at: string;
  updated_at: string;
};

type Column = {
  id: Task["status"];
  label: string;
  color: string;
  dot: string;
  accentClass: string;
};

const COLUMNS: Column[] = [
  { id: "todo", label: "New Lead", color: "text-white/60", dot: "bg-white/25", accentClass: "border-white/10" },
  { id: "doing", label: "Qualified", color: "text-primary", dot: "bg-primary", accentClass: "border-primary/25" },
  { id: "needs_input", label: "Viewing Booked", color: "text-amber", dot: "bg-amber", accentClass: "border-amber/25" },
  { id: "done", label: "Offer / Closed", color: "text-success", dot: "bg-success", accentClass: "border-success/25" },
];

const PROPERTY_TYPES = [
  "Studio", "1BR Apartment", "2BR Apartment", "3BR Apartment",
  "4BR+ Apartment", "Villa / Townhouse", "Penthouse",
  "Commercial Office", "Retail Space", "Warehouse",
];

const DUBAI_AREAS = [
  "Dubai Marina", "Downtown Dubai", "JVC", "JBR", "Palm Jumeirah",
  "Business Bay", "DIFC", "Deira", "Bur Dubai", "Jumeirah", "Al Barsha",
  "Silicon Oasis", "Mirdif", "Sharjah", "Ajman",
];

export default function REPipeline() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  async function load() {
    try {
      const list = await call<Task[]>("task.list");
      setTasks(list);
    } catch {}
    setLoaded(true);
  }

  useEffect(() => { void load(); }, []);

  async function moveTask(taskId: string, newStatus: Task["status"]) {
    if (moving) return;
    setMoving(taskId);
    const prev = tasks;
    setTasks((t) => t.map((tk) => tk.id === taskId ? { ...tk, status: newStatus } : tk));
    try {
      await call("task.update", { id: taskId, status: newStatus });
    } catch {
      setTasks(prev);
    } finally {
      setMoving(null);
    }
  }

  const totalValue = tasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => {
      const v = parseFloat(String(t.metadata?.estimated_value ?? "0").replace(/[^0-9.]/g, ""));
      return s + (isNaN(v) ? 0 : v);
    }, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-2xl">Deal Pipeline</h1>
          <p className="text-white/50 text-sm mt-1">Track prospects from first contact to closed deal</p>
        </div>
        <div className="flex items-center gap-3">
          {totalValue > 0 && (
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
              <DollarSign size={14} className="text-success" />
              <span className="text-sm font-bold text-success">
                AED {totalValue.toLocaleString()} closed
              </span>
            </div>
          )}
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={13} /> Add Deal
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length;
          return (
            <GlassCard key={col.id} className="p-3 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
              <div>
                <div className={`text-lg font-display font-bold ${col.color}`}>{count}</div>
                <div className="text-[10px] text-white/35 font-semibold uppercase tracking-wide">{col.label}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Kanban board */}
      {!loaded ? (
        <GlassCard className="p-8 text-center"><div className="text-white/30 text-sm">Loading pipeline…</div></GlassCard>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.accentClass} bg-white/[0.015] p-3 min-h-[400px]`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragging) void moveTask(dragging, col.id);
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white/25">{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <DealCard
                      key={task.id}
                      task={task}
                      columns={COLUMNS}
                      currentCol={col}
                      moving={moving === task.id}
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => setDragging(null)}
                      onMove={(status) => void moveTask(task.id, status)}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-white/20">
                      {col.id === "todo" ? "Drag leads here or add manually" : "—"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddDealModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); void load(); }}
        />
      )}
    </div>
  );
}

function DealCard({
  task, columns, currentCol, moving, onDragStart, onDragEnd, onMove,
}: {
  task: Task;
  columns: Column[];
  currentCol: Column;
  moving: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (s: Task["status"]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`glass p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all ${moving ? "opacity-50" : "hover:border-white/15"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-bold text-sm text-white leading-tight">{task.title}</span>
        <button onClick={() => setOpen(!open)} className="text-white/25 hover:text-white/60 transition-colors shrink-0">
          <ChevronRight size={12} className={`transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
      </div>

      {task.metadata?.property_type && (
        <span className="text-[10px] text-white/40 font-semibold">{task.metadata.property_type}</span>
      )}
      {task.metadata?.area && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-white/35">
          <MapPin size={8} />{task.metadata.area}
        </div>
      )}
      {task.metadata?.estimated_value && (
        <div className="flex items-center gap-1 mt-1 text-xs font-bold text-success">
          <DollarSign size={10} />AED {task.metadata.estimated_value}
        </div>
      )}

      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] space-y-1.5">
          {task.metadata?.phone && (
            <a
              href={`https://wa.me/${task.metadata.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-success hover:underline"
            >
              <Phone size={9} />{task.metadata.phone}
            </a>
          )}
          {task.metadata?.email && (
            <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
              <Mail size={9} />{task.metadata.email}
            </div>
          )}
          {task.metadata?.source && (
            <div className="text-[10px] text-white/30">Source: {task.metadata.source}</div>
          )}
          <div className="text-[10px] text-white/25"><Clock size={8} className="inline mr-1" />{timeAgo(task.updated_at)}</div>
          {/* Stage move buttons */}
          <div className="flex flex-wrap gap-1 pt-1">
            {columns.filter((c) => c.id !== currentCol.id).map((c) => (
              <button
                key={c.id}
                onClick={() => onMove(c.id)}
                className={`text-[9px] px-2 py-0.5 rounded-full border ${c.accentClass} ${c.color} hover:bg-white/5 transition-colors`}
              >
                → {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddDealModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [propType, setPropType] = useState("");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("manual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await call("task.create", {
        title: title.trim(),
        status: "todo",
        metadata: {
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          area: area || undefined,
          property_type: propType || undefined,
          estimated_value: value.trim() || undefined,
          source,
        },
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create deal");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-display font-bold text-base text-white">Add Deal</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Contact / Company Name *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Ravi Sharma — Dubai Marina Buyer" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">WhatsApp / Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+971 50 000 0000" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="email@brokerage.ae" />
            </div>
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
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Property Type</label>
              <select value={propType} onChange={(e) => setPropType(e.target.value)} className="input-field">
                <option value="">Select type…</option>
                {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Estimated Value (AED)</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} className="input-field" placeholder="e.g. 1,500,000" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
                <option value="manual">Manual</option>
                <option value="campaign">Campaign</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referral">Referral</option>
                <option value="portal">Portal (Bayut/PF)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-lg text-xs text-danger">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !title.trim()} className="btn-primary text-sm flex-1 flex items-center gap-2 justify-center">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Add to Pipeline"}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
