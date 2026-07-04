import { useEffect, useState, useMemo } from "react";
import {
  Plus, Calendar as CalendarIcon, List, Clock, MapPin, Phone,
  Mail, User, Home, X, AlertCircle, Loader2, CheckCircle,
  AlertTriangle, Sparkles, TrendingUp, Trash2, Edit,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { call } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

type Appointment = {
  id: string;
  title: string;
  lead_name: string;
  lead_phone: string;
  lead_email: string;
  type: string;
  property_id: string | null;
  property_address: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string;
  no_show_risk: number;
  created_at: string;
  updated_at: string;
};

type Property = {
  id: string;
  title: string;
  area: string;
  address: string;
};

const TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType<any> }> = {
  consultation: { label: "Consultation", color: "text-primary", icon: User },
  viewing: { label: "Property Viewing", color: "text-success", icon: Home },
  closing: { label: "Closing", color: "text-accent", icon: CheckCircle },
  negotiation: { label: "Negotiation", color: "text-amber", icon: TrendingUp },
  follow_up: { label: "Follow-up", color: "text-purple", icon: Phone },
};

const STATUS_META: Record<string, { label: string; tag: string }> = {
  scheduled: { label: "Scheduled", tag: "bg-primary/15 border-primary/35 text-primary" },
  confirmed: { label: "Confirmed", tag: "bg-success/15 border-success/35 text-success" },
  completed: { label: "Completed", tag: "bg-white/8 border-white/20 text-white/60" },
  no_show: { label: "No Show", tag: "bg-danger/15 border-danger/35 text-danger" },
  cancelled: { label: "Cancelled", tag: "bg-white/5 border-white/15 text-white/30" },
};

export default function REAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showAdd, setShowAdd] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try {
      const [a, p] = await Promise.all([
        call<Appointment[]>("re.appointment.list").catch(() => []),
        call<Property[]>("re.property.list").catch(() => []),
      ]);
      setAppointments(Array.isArray(a) ? a : []);
      setProperties(Array.isArray(p) ? p : []);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const todayCount = appointments.filter((a) => new Date(a.scheduled_at).toDateString() === today).length;
    const weekCount = appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    const completed = appointments.filter((a) => a.status === "completed" || a.status === "confirmed").length;
    const noShows = appointments.filter((a) => a.status === "no_show").length;
    const total = appointments.length;
    const confirmedRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round((noShows / total) * 100) : 0;

    return { todayCount, weekCount, confirmedRate, noShowRate };
  }, [appointments]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => new Date(a.scheduled_at).getTime() >= now - 12 * 60 * 60 * 1000)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [appointments]);

  const past = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => new Date(a.scheduled_at).getTime() < now - 12 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  }, [appointments]);

  const nextHighRisk = upcoming.find((a) => a.no_show_risk >= 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-2xl">Appointments</h1>
          <p className="text-white/50 text-sm mt-1">AI-powered scheduling for consultations, viewings, and closings</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-xs">
          <Plus size={13} /> New Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Today" value={stats.todayCount} icon={CalendarIcon} sub="scheduled" color="text-primary" />
        <StatCard label="This Week" value={stats.weekCount} icon={Clock} sub="upcoming" color="text-purple" />
        <StatCard label="Confirmed Rate" value={stats.confirmedRate} icon={CheckCircle} sub="%" color="text-success" suffix="%" />
        <StatCard label="No-Show Rate" value={stats.noShowRate} icon={AlertTriangle} sub="%" color="text-danger" suffix="%" />
      </div>

      {/* View toggle + AI insights */}
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === "list" ? "bg-primary/15 border border-primary/35 text-primary" : "border border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              <List size={12} /> List View
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === "calendar" ? "bg-primary/15 border border-primary/35 text-primary" : "border border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              <CalendarIcon size={12} /> Calendar View
            </button>
          </div>

          {!loaded && (
            <GlassCard className="p-8 text-center"><div className="text-white/30 text-sm">Loading…</div></GlassCard>
          )}

          {loaded && appointments.length === 0 && (
            <GlassCard className="p-12 text-center">
              <CalendarIcon size={40} className="mx-auto mb-3 text-white/15" />
              <p className="font-semibold text-white/60 mb-1">No appointments yet</p>
              <p className="text-white/40 text-sm mb-4">Schedule your first property viewing or consultation.</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-2 mx-auto">
                <Plus size={14} /> Add Appointment
              </button>
            </GlassCard>
          )}

          {view === "list" && loaded && appointments.length > 0 && (
            <div className="space-y-4">
              {upcoming.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Upcoming</p>
                  <div className="space-y-2">
                    {upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} onUpdate={load} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Past</p>
                  <div className="space-y-2 opacity-70">
                    {past.slice(0, 10).map((a) => <AppointmentCard key={a.id} appointment={a} onUpdate={load} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "calendar" && loaded && (
            <CalendarView appointments={appointments} />
          )}
        </div>

        {/* AI insights sidebar */}
        <div className="space-y-4">
          <GlassCard className="p-5 border-primary/20 bg-primary/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <p className="font-display font-bold text-xs text-white/70 tracking-widest uppercase">AI Scheduling Recommendation</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white">Thursday 2:00 PM</span>
                <span className="text-[10px] px-2 py-0.5 bg-success/20 text-success rounded-full font-bold">92% confidence</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/60 pt-2">
                <li className="flex items-start gap-1.5"><CheckCircle size={10} className="text-success mt-0.5 shrink-0" />Your typical high-performance slot</li>
                <li className="flex items-start gap-1.5"><CheckCircle size={10} className="text-success mt-0.5 shrink-0" />Light Dubai traffic (15 min drive)</li>
                <li className="flex items-start gap-1.5"><CheckCircle size={10} className="text-success mt-0.5 shrink-0" />Optimal natural lighting for photos</li>
                <li className="flex items-start gap-1.5"><CheckCircle size={10} className="text-success mt-0.5 shrink-0" />Leads respond 40% better afternoons</li>
              </ul>
            </div>
          </GlassCard>

          {nextHighRisk && (
            <GlassCard className="p-5 border-amber/25 bg-amber/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber" />
                <p className="font-display font-bold text-xs text-white/70 tracking-widest uppercase">No-Show Risk Alert</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-white/80 font-bold">{nextHighRisk.lead_name}</p>
                <p className="text-xs text-white/50">{TYPE_META[nextHighRisk.type]?.label ?? nextHighRisk.type} · {new Date(nextHighRisk.scheduled_at).toLocaleString()}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber font-bold">{nextHighRisk.no_show_risk}% risk</span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/60">Send WhatsApp reminder now</span>
                </div>
                {nextHighRisk.lead_phone && (
                  <a
                    href={`https://wa.me/${nextHighRisk.lead_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${nextHighRisk.lead_name}, just confirming our ${TYPE_META[nextHighRisk.type]?.label ?? "appointment"} at ${new Date(nextHighRisk.scheduled_at).toLocaleTimeString()}. Looking forward to it!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs w-full flex items-center gap-1.5 justify-center mt-2"
                  >
                    <Phone size={10} /> Send Reminder
                  </a>
                )}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-4">
            <p className="font-display font-bold text-xs text-white/60 tracking-widest uppercase mb-3">Quick Stats</p>
            <div className="space-y-2 text-xs">
              <StatRow label="Total appointments" value={appointments.length} />
              <StatRow label="Viewings" value={appointments.filter((a) => a.type === "viewing").length} />
              <StatRow label="Consultations" value={appointments.filter((a) => a.type === "consultation").length} />
              <StatRow label="Closings" value={appointments.filter((a) => a.type === "closing").length} />
            </div>
          </GlassCard>
        </div>
      </div>

      {showAdd && (
        <AddAppointmentModal
          properties={properties}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); void load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub, color, suffix }: { label: string; value: number; icon: React.ElementType<any>; sub: string; color: string; suffix?: string }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40 font-semibold uppercase tracking-wide">{label}</span>
        <Icon size={13} className={color} />
      </div>
      <div className={`text-2xl font-display font-bold ${color}`}>
        <AnimatedNumber value={value} />{suffix ?? ""}
      </div>
      <div className="text-[10px] text-white/40 mt-1">{sub}</div>
    </GlassCard>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

function AppointmentCard({ appointment: a, onUpdate }: { appointment: Appointment; onUpdate: () => void }) {
  const typeMeta = TYPE_META[a.type] ?? { label: a.type, color: "text-white", icon: CalendarIcon };
  const statusMeta = STATUS_META[a.status] ?? { label: a.status, tag: "bg-white/8 border-white/20 text-white/50" };
  const dt = new Date(a.scheduled_at);
  const dateStr = dt.toLocaleDateString("en-GB", { weekday: "long", month: "short", day: "numeric" });
  const timeStr = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const [showAI, setShowAI] = useState(false);

  async function updateStatus(newStatus: string) {
    await call("re.appointment.update", { id: a.id, status: newStatus }).catch(() => {});
    onUpdate();
  }

  async function del() {
    if (!confirm("Delete this appointment?")) return;
    await call("re.appointment.delete", { id: a.id }).catch(() => {});
    onUpdate();
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl glass flex items-center justify-center shrink-0 ${typeMeta.color}`}>
          <typeMeta.icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`tag text-[9px] ${statusMeta.tag}`}>{statusMeta.label}</span>
            <span className={`tag text-[9px] bg-white/5 border-white/15 ${typeMeta.color}`}>{typeMeta.label}</span>
            {a.no_show_risk >= 20 && (
              <span className="tag text-[9px] bg-amber/15 border-amber/35 text-amber">
                <AlertTriangle size={9} /> {a.no_show_risk}% risk
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mb-1">
            <User size={11} className="text-white/40" />
            <span className="font-bold text-sm text-white">{a.lead_name || "Unnamed"}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1"><CalendarIcon size={10} />{dateStr}</span>
            <span className="flex items-center gap-1"><Clock size={10} />{timeStr}</span>
            {a.property_address && <span className="flex items-center gap-1"><MapPin size={10} />{a.property_address}</span>}
          </div>
          {a.notes && <p className="text-xs text-white/50 mt-2 leading-relaxed">{a.notes}</p>}
          <div className="flex items-center gap-2 mt-3">
            {a.lead_phone && (
              <a
                href={`tel:${a.lead_phone}`}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
              >
                <Phone size={9} /> Call
              </a>
            )}
            {a.lead_phone && (
              <a
                href={`https://wa.me/${a.lead_phone.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-success text-xs flex items-center gap-1.5 py-1 px-2.5"
              >
                <MessageIcon /> WhatsApp
              </a>
            )}
            <div className="ml-auto flex items-center gap-2">
              {a.status === "scheduled" && (
                <button onClick={() => updateStatus("confirmed")} className="text-xs text-success hover:underline">Confirm</button>
              )}
              {(a.status === "scheduled" || a.status === "confirmed") && (
                <>
                  <button onClick={() => updateStatus("completed")} className="text-xs text-white/60 hover:text-white">Done</button>
                  <button onClick={() => updateStatus("no_show")} className="text-xs text-danger/70 hover:text-danger">No-show</button>
                </>
              )}
              <button onClick={del} className="text-white/25 hover:text-danger"><Trash2 size={11} /></button>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function MessageIcon() {
  return <Phone size={9} />;
}

function CalendarView({ appointments }: { appointments: Appointment[] }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: Array<{ date: Date | null; apps: Appointment[] }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ date: null, apps: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    const apps = appointments.filter((a) => new Date(a.scheduled_at).toDateString() === date.toDateString());
    cells.push({ date, apps });
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-bold text-sm text-white">
          {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-[10px] text-white/30 font-bold uppercase tracking-wider py-2">{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} className="h-16" />;
          const isToday = cell.date.toDateString() === now.toDateString();
          return (
            <div key={i} className={`h-16 border rounded-lg p-1 ${isToday ? "border-primary/50 bg-primary/5" : "border-white/[0.06]"}`}>
              <div className={`text-[10px] font-bold text-right ${isToday ? "text-primary" : "text-white/50"}`}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-0.5 mt-0.5">
                {cell.apps.slice(0, 2).map((a) => {
                  const typeMeta = TYPE_META[a.type];
                  return (
                    <div key={a.id} className={`text-[9px] px-1 py-0.5 rounded truncate bg-white/5 ${typeMeta?.color ?? "text-white/60"}`}>
                      {a.lead_name || a.title}
                    </div>
                  );
                })}
                {cell.apps.length > 2 && <div className="text-[9px] text-white/40">+{cell.apps.length - 2} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function AddAppointmentModal({
  properties, onClose, onCreated,
}: { properties: Property[]; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [type, setType] = useState("viewing");
  const [propertyId, setPropertyId] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!leadName.trim() || !date) { setError("Lead name and date required"); return; }
    setSaving(true); setError(null);
    try {
      const scheduled_at = new Date(`${date}T${time}:00`).toISOString();
      await call("re.appointment.create", {
        title: title.trim() || `${TYPE_META[type]?.label} with ${leadName}`,
        lead_name: leadName.trim(),
        lead_phone: leadPhone.trim(),
        lead_email: leadEmail.trim(),
        type,
        property_id: propertyId || null,
        property_address: propertyAddress.trim(),
        scheduled_at,
        duration_minutes: duration,
        notes: notes.trim(),
        status: "scheduled",
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
          <h2 className="font-display font-bold text-base text-white">New Appointment</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Appointment Type</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(TYPE_META).map(([id, meta]) => (
                <button
                  key={id}
                  onClick={() => setType(id)}
                  className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    type === id ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <meta.icon size={13} className={meta.color} />
                  <span className="text-[9px] font-bold text-white/70">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Lead Name *</label>
              <input value={leadName} onChange={(e) => setLeadName(e.target.value)} className="input-field" placeholder="e.g. Ravi Sharma" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Phone / WhatsApp</label>
              <input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} className="input-field" placeholder="+971 50 000 0000" />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
            <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} className="input-field" placeholder="email@example.com" />
          </div>

          {properties.length > 0 && (
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Property (optional)</label>
              <select value={propertyId} onChange={(e) => {
                setPropertyId(e.target.value);
                const p = properties.find((x) => x.id === e.target.value);
                if (p) setPropertyAddress(`${p.title} — ${p.area}`);
              }} className="input-field">
                <option value="">— No specific property —</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.area}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Location / Address</label>
            <input value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} className="input-field" placeholder="Dubai Marina, Building 5, Apt 1203" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Duration (min)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5 block">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input-field resize-none" placeholder="Preferences, budget range, buyer intent…" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/25 rounded-lg text-xs text-danger">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-white/[0.06] shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
          <button onClick={save} disabled={saving || !leadName.trim() || !date} className="btn-primary text-sm flex-1 flex items-center gap-2 justify-center">
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Schedule Appointment"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
