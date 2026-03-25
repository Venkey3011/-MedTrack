import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  Calendar, 
  FileText, 
  LogOut, 
  Menu, 
  Plus, 
  User as UserIcon, 
  X, 
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Upload,
  Trash2,
  Download,
  ExternalLink,
  Settings,
  LayoutDashboard
} from "lucide-react";
import { cn } from "./lib/utils";
import { User, Medication, Report, Notification as AppNotification } from "./types";

const formatTime = (timeStr: string) => {
  if (!timeStr || timeStr === "None") return timeStr;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Profile Editor Component
const ProfileEditor = ({ patientId, onComplete }: { patientId: string | null, onComplete: () => void }) => {
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(!!patientId);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "A+",
    phone: "",
    address: "",
    doctorName: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const url = patientId ? `/api/patients/${patientId}` : "/api/me";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            age: data.age?.toString() || "",
            gender: data.gender || "Male",
            bloodGroup: data.bloodGroup || "A+",
            phone: data.phone || "",
            address: data.address || "",
            doctorName: data.doctorName || ""
          });
        }
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [patientId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = patientId ? `/api/patients/${patientId}` : "/api/profile";
      const res = await fetch(url, {
        method: patientId ? "PUT" : "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updatedData = await res.json();
        if (!patientId) {
          updateUser(updatedData);
        }
        toast.success("Profile updated!");
        onComplete();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading profile...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
      <h3 className="text-xl font-display font-bold text-slate-900 mb-6">Personal Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input 
            type="text" 
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input 
              type="number" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.bloodGroup}
            onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
          >
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <input 
            type="tel" 
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea 
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor's Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.doctorName}
            onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
            placeholder="Name of the doctor you are visiting"
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-100 mt-4"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

const NotificationManager = ({ patients, onSend }: { patients: User[], onSend: (notif: any) => Promise<void> }) => {
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "urgent">("info");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await onSend({ patientIds: selectedPatients, title, message, type });
    setTitle(""); setMessage(""); setSelectedPatients([]);
    setSending(false);
  };

  const togglePatient = (id: string) => {
    setSelectedPatients(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
      <h3 className="text-xl font-display font-bold text-slate-900 mb-6">Send Notification</h3>
      <form onSubmit={handleSend} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Appointment Reminder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here..."
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Patients (Empty for ALL)</label>
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">{selectedPatients.length} Selected</span>
                <button 
                  type="button"
                  onClick={() => setSelectedPatients([])}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[250px] p-2 space-y-1">
                {patients.map(p => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => togglePatient(p._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all",
                      selectedPatients.includes(p._id) ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      selectedPatients.includes(p._id) ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                    )}>
                      {selectedPatients.includes(p._id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">If no patients are selected, the notification will be sent to ALL patients.</p>
          </div>
        </div>

        <button 
          type="submit"
          disabled={sending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" />
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );
};

const NotificationList = ({ notifications, onDelete }: { notifications: AppNotification[], onDelete?: (id: string) => void }) => {
  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 italic">No notifications yet.</p>
        </div>
      ) : (
        notifications.map(notif => (
          <div 
            key={notif._id} 
            className={cn(
              "p-6 rounded-3xl border shadow-sm transition-all",
              notif.type === 'urgent' ? "bg-red-50 border-red-100" : 
              notif.type === 'warning' ? "bg-amber-50 border-amber-100" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  notif.type === 'urgent' ? "bg-red-100 text-red-600" : 
                  notif.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>
                  {notif.type === 'urgent' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{notif.title}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {new Date(notif.date).toLocaleString()}
                  </p>
                </div>
              </div>
              {onDelete && (
                <button 
                  onClick={() => onDelete(notif._id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{notif.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

const PatientDetailView = ({ patientId, onBack, onAddMed, onEdit }: { patientId: string, onBack: () => void, onAddMed: (med: any, pid: string) => Promise<boolean>, onEdit: () => void }) => {
  const { token } = useAuth();
  const [patient, setPatient] = useState<User | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [reportBlobUrl, setReportBlobUrl] = useState<string | null>(null);
  const [showAddMed, setShowAddMed] = useState(false);

  const fetchPatientData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, mRes, rRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`, { headers }),
        fetch(`/api/medications?patientId=${patientId}`, { headers }),
        fetch(`/api/reports?patientId=${patientId}`, { headers })
      ]);
      
      setPatient(await pRes.json());
      setMeds(await mRes.json());
      setReports(await rRes.json());
    } catch (err) {
      toast.error("Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId, token]);

  const handleAddMed = async (med: any) => {
    const success = await onAddMed(med, patientId);
    if (success) {
      setShowAddMed(false);
      fetchPatientData();
    }
  };

  useEffect(() => {
    if (viewingReport?.fileUrl?.includes('application/pdf')) {
      const fetchBlob = async () => {
        try {
          const res = await fetch(viewingReport.fileUrl!);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setReportBlobUrl(url);
        } catch (err) {
          console.error("Error creating blob URL:", err);
        }
      };
      fetchBlob();
    } else {
      setReportBlobUrl(null);
    }
    return () => { if (reportBlobUrl) URL.revokeObjectURL(reportBlobUrl); };
  }, [viewingReport]);

  if (loading) return <div className="p-12 text-center text-slate-400">Loading details...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
          <X className="w-6 h-6 rotate-45" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">{patient?.name}</h2>
          <p className="text-slate-500">{patient?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-slate-900">Patient Profile</h3>
              <button 
                onClick={onEdit}
                className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                title="Edit Profile"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Age / Gender</p>
                <p className="font-medium text-slate-900 font-mono">{patient?.age} / {patient?.gender}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Blood Group</p>
                <p className="font-medium text-slate-900 font-mono">{patient?.bloodGroup}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phone</p>
                <p className="font-medium text-slate-900 font-mono">{patient?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Address</p>
                <p className="font-medium text-slate-900">{patient?.address}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Visiting Doctor</p>
                <p className="font-medium text-blue-600">{patient?.doctorName || "Not assigned"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-slate-900">Medications</h3>
              <button 
                onClick={() => setShowAddMed(!showAddMed)}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {showAddMed && (
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Add New Medication</h4>
                <MedicationForm onAdd={handleAddMed} />
              </div>
            )}

            <div className="space-y-3">
              {meds.length === 0 ? (
                <p className="text-slate-400 text-sm italic">No medications listed.</p>
              ) : (
                meds.map(med => (
                  <div key={med._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                      {!med.active && <span className="text-[8px] bg-slate-200 px-1 rounded uppercase font-mono">Paused</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{med.dosage} • {formatTime(med.time)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Medical Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.length === 0 ? (
                <p className="text-slate-400 text-sm italic col-span-2">No reports uploaded.</p>
              ) : (
                reports.map(report => (
                  <div 
                    key={report._id} 
                    onClick={() => setViewingReport(report)}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-blue-200 transition-colors">
                        <FileText className="text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{report.title}</h4>
                        <p className="text-[10px] text-slate-500">{new Date(report.date).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Viewer for Patient Detail */}
      <AnimatePresence>
        {viewingReport && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">{viewingReport.title}</h3>
                  <p className="text-sm text-slate-500 font-mono">{new Date(viewingReport.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {reportBlobUrl && (
                    <a href={reportBlobUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-blue-600 flex items-center gap-2 text-sm font-bold">
                      <ExternalLink className="w-5 h-5" />
                      <span className="hidden md:inline">Fullscreen</span>
                    </a>
                  )}
                  <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 overflow-auto p-4 flex items-center justify-center relative">
                {viewingReport.fileUrl ? (
                  viewingReport.fileUrl.includes('application/pdf') ? (
                    <div className="w-full h-full flex flex-col">
                      {reportBlobUrl ? (
                        <object data={reportBlobUrl} type="application/pdf" className="w-full h-full rounded-xl border border-slate-200 flex-1" />
                      ) : (
                        <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
                      )}
                    </div>
                  ) : (
                    <img src={viewingReport.fileUrl} alt={viewingReport.title} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" referrerPolicy="no-referrer" />
                  )
                ) : (
                  <div className="text-slate-400 italic">No file attached</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Complete Profile Component
const CompleteProfile = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserIcon className="text-blue-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Complete Your Profile</h2>
          <p className="text-slate-500">Please provide some basic information to get started.</p>
        </div>
        <ProfileEditor patientId={null} onComplete={() => window.location.reload()} />
      </div>
    </div>
  );
};

// Components
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">MedTrack</h1>
          <p className="text-slate-500">Patient Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-100 mt-4"
          >
            Sign In
          </button>
        </form>
        <p className="text-center mt-6 text-slate-600 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "patient" }),
      });
      if (res.ok) {
        toast.success("Account created! Please login.");
        navigate("/login");
      } else {
        const data = await res.json();
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-100 mt-4"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-6 text-slate-600 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "meds" | "patients" | "profile" | "notifications">("overview");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'med' | 'report' | 'patient' | 'notification' } | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [reportBlobUrl, setReportBlobUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (viewingReport?.fileUrl?.startsWith('data:application/pdf')) {
      // Convert data URL to Blob URL for better iframe compatibility
      const fetchBlob = async () => {
        try {
          const res = await fetch(viewingReport.fileUrl!);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setReportBlobUrl(url);
        } catch (err) {
          console.error("Error creating blob URL:", err);
        }
      };
      fetchBlob();
    } else {
      setReportBlobUrl(null);
    }

    return () => {
      if (reportBlobUrl) {
        URL.revokeObjectURL(reportBlobUrl);
      }
    };
  }, [viewingReport]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        if (user?.role === "admin") {
          const pRes = await fetch("/api/patients", { headers });
          setPatients(await pRes.json());
        }
        
        const rRes = await fetch("/api/reports", { headers });
        setReports(await rRes.json());

        const nRes = await fetch("/api/notifications", { headers });
        setNotifications(await nRes.json());
        
        if (user?.role === "patient") {
          const mRes = await fetch("/api/medications", { headers });
          setMedications(await mRes.json());
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, [user, token]);

  if (user?.role === "patient" && !user.profileComplete) {
    return <CompleteProfile />;
  }

  const deletePatient = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Patient deleted successfully");
        setPatients(patients.filter(p => p._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete patient");
    }
  };

  const addMedication = async (med: Partial<Medication>, patientId?: string) => {
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(patientId ? { ...med, patientId } : med),
    });
    if (res.ok) {
      const newMed = await res.json();
      if (!patientId) {
        setMedications([...medications, newMed]);
      }
      toast.success("Medication added");
      return true;
    }
    return false;
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;
    try {
      if (type === 'report') {
        await deleteReport(id);
      } else if (type === 'med') {
        await deleteMedication(id);
      } else if (type === 'patient') {
        await deletePatient(id);
      } else if (type === 'notification') {
        await deleteNotification(id);
      }
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  const deleteMedication = async (id: string) => {
    const res = await fetch(`/api/medications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMedications(medications.filter(m => m._id !== id));
      toast.success("Medication removed");
      setConfirmDelete(null);
    }
  };

  const uploadReport = async (report: Partial<Report>) => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(report),
    });
    if (res.ok) {
      const newReport = await res.json();
      setReports([...reports, newReport]);
      toast.success("Report uploaded");
    }
  };

  const deleteReport = async (id: string) => {
    const res = await fetch(`/api/reports/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setReports(reports.filter(r => r._id !== id));
      toast.success("Report removed");
      setConfirmDelete(null);
    }
  };

  const sendNotification = async (notif: any) => {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(notif),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications([...data, ...notifications]);
      } else {
        setNotifications([data, ...notifications]);
      }
      toast.success("Notification sent!");
    }
  };

  const deleteNotification = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success("Notification removed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertCircle className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 text-center mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-center mb-8">This action cannot be undone. This will permanently delete the item.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Viewer Modal */}
      <AnimatePresence>
        {viewingReport && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">{viewingReport.title}</h3>
                  <p className="text-sm text-slate-500">
                    {new Date(viewingReport.date).toLocaleDateString()} 
                    {user?.role === "admin" && viewingReport.patientId && ` • Patient: ${viewingReport.patientId.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {reportBlobUrl && (
                    <a 
                      href={reportBlobUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-blue-600 flex items-center gap-2 text-sm font-bold"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="hidden md:inline">Fullscreen</span>
                    </a>
                  )}
                  <button 
                    onClick={() => setViewingReport(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 overflow-auto p-4 flex items-center justify-center relative group">
                {viewingReport.fileUrl ? (
                  viewingReport.fileUrl.includes('application/pdf') ? (
                    <div className="w-full h-full flex flex-col">
                      {reportBlobUrl ? (
                        <object 
                          data={reportBlobUrl} 
                          type="application/pdf" 
                          className="w-full h-full rounded-xl border border-slate-200 flex-1"
                        >
                          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                              <AlertCircle className="text-amber-600 w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">PDF Viewer Blocked</h4>
                            <p className="text-slate-500 mb-6 max-w-md">Your browser's built-in PDF viewer is disabled or blocked. Please use the button below to view the report.</p>
                            <a 
                              href={reportBlobUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                            >
                              <ExternalLink className="w-5 h-5" /> Open PDF in New Tab
                            </a>
                          </div>
                        </object>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <p className="text-slate-500 font-medium">Preparing PDF...</p>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex justify-center gap-3">
                        <a 
                          href={viewingReport.fileUrl} 
                          download={`${viewingReport.title.replace(/\s+/g, '_')}.pdf`}
                          className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download
                        </a>
                        {reportBlobUrl && (
                          <a 
                            href={reportBlobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" /> View Fullscreen
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img 
                        src={viewingReport.fileUrl} 
                        alt={viewingReport.title}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                      <a 
                        href={viewingReport.fileUrl} 
                        download={`${viewingReport.title.replace(/\s+/g, '_')}.png`}
                        className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  )
                ) : (
                  <div className="text-center p-12">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No file attached to this report.</p>
                  </div>
                )}
              </div>
              {viewingReport.description && (
                <div className="p-6 bg-white border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-slate-700 leading-relaxed">{viewingReport.description}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600 w-6 h-6" />
          <span className="font-bold text-lg">MedTrack</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 z-[100] flex flex-col transition-all",
              !isSidebarOpen && "hidden md:flex"
            )}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Activity className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">MedTrack</span>
              </div>
              <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-1">
              <SidebarItem 
                icon={<LayoutDashboard />} 
                label="Overview" 
                active={activeTab === "overview"} 
                onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={<FileText />} 
                label={user?.role === "admin" ? "Notifications" : "Reports"} 
                active={activeTab === "reports"} 
                onClick={() => { setActiveTab("reports"); setIsSidebarOpen(false); }} 
              />
              {user?.role === "patient" && (
                <SidebarItem 
                  icon={<Bell />} 
                  label="Notifications" 
                  active={activeTab === "notifications"} 
                  onClick={() => { setActiveTab("notifications"); setIsSidebarOpen(false); }} 
                />
              )}
              {user?.role === "patient" && (
                <SidebarItem 
                  icon={<Clock />} 
                  label="Medications" 
                  active={activeTab === "meds"} 
                  onClick={() => { setActiveTab("meds"); setIsSidebarOpen(false); }} 
                />
              )}
              {user?.role === "admin" && (
                <SidebarItem 
                  icon={<UserIcon />} 
                  label="Patients" 
                  active={activeTab === "patients"} 
                  onClick={() => { setActiveTab("patients"); setIsSidebarOpen(false); setSelectedPatientId(null); }} 
                />
              )}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={() => { setActiveTab("profile"); setIsSidebarOpen(false); setSelectedPatientId(null); }}
                className={cn(
                  "w-full bg-slate-50 rounded-2xl p-4 mb-4 flex items-center gap-3 text-left transition-all hover:bg-slate-100 border border-transparent group",
                  activeTab === "profile" && !selectedPatientId && "border-blue-200 bg-blue-50/50"
                )}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                  <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-slate-300 transition-all", activeTab === "profile" && "rotate-90 text-blue-500")} />
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
            {activeTab === "overview" && `Welcome back, ${user?.name.split(" ")[0]}`}
            {activeTab === "reports" && (user?.role === "admin" ? "Patient Notifications" : "Medical Reports")}
            {activeTab === "notifications" && "My Notifications"}
            {activeTab === "meds" && "Medication Schedule"}
            {activeTab === "patients" && (selectedPatientId ? "Patient Details" : "Patient Directory")}
            {activeTab === "profile" && (selectedPatientId ? "Edit Patient Profile" : "My Profile")}
          </h1>
          <p className="text-slate-500">
            {activeTab === "overview" && "Here's what's happening with your health today."}
            {activeTab === "reports" && (user?.role === "admin" ? "Send and manage notifications for your patients." : "Manage and view all medical checkups and reports.")}
            {activeTab === "notifications" && "Stay updated with messages from your healthcare provider."}
            {activeTab === "meds" && "Keep track of your medicine timings and dosages."}
            {activeTab === "patients" && (selectedPatientId ? "Detailed view of patient health records." : "Manage all registered patients and their data.")}
            {activeTab === "profile" && (selectedPatientId ? "Update patient information and medical history." : "Manage your personal information and preferences.")}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <ProfileEditor 
                patientId={selectedPatientId} 
                onComplete={() => {
                  if (selectedPatientId) {
                    setActiveTab("patients");
                    setSelectedPatientId(null);
                  } else {
                    setActiveTab("overview");
                  }
                }} 
              />
            </motion.div>
          )}

          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <StatCard 
                title={user?.role === "admin" ? "Total Patients" : "Active Meds"} 
                value={user?.role === "admin" ? patients.length : medications.filter(m => m.active).length} 
                icon={<Activity className="text-blue-600" />}
                color="blue"
              />
              <StatCard 
                title={user?.role === "admin" ? "Sent Notifications" : "Total Reports"} 
                value={user?.role === "admin" ? notifications.length : reports.length} 
                icon={user?.role === "admin" ? <Bell className="text-emerald-600" /> : <FileText className="text-emerald-600" />}
                color="emerald"
              />
              <StatCard 
                title={user?.role === "admin" ? "Total Reports" : "Next Reminder"} 
                value={user?.role === "admin" ? reports.length : (medications[0] ? formatTime(medications[0].time) : "None")} 
                icon={user?.role === "admin" ? <FileText className="text-amber-600" /> : <Bell className="text-amber-600" />}
                color="amber"
              />
              {user?.role === "patient" && (
                <StatCard 
                  title="My Doctor" 
                  value={user?.doctorName || "Not assigned"} 
                  icon={<UserIcon className="text-indigo-600" />}
                  color="indigo"
                />
              )}

              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-display font-bold text-slate-900">
                      {user?.role === "admin" ? "Recent Notifications" : "Recent Reports"}
                    </h3>
                    <button onClick={() => setActiveTab("reports")} className="text-blue-600 text-sm font-semibold hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {user?.role === "admin" ? (
                      notifications.slice(0, 3).map(notif => (
                        <div key={notif._id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                            <Bell className="text-slate-400 w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{notif.title}</h4>
                            <p className="text-xs text-slate-500 font-mono">{new Date(notif.date).toLocaleDateString()} • {notif.patientId ? `To: ${notif.patientId.name}` : "To: All"}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </div>
                      ))
                    ) : (
                      reports.slice(0, 3).map(report => (
                        <div key={report._id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                            <FileText className="text-slate-400 w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{report.title}</h4>
                            <p className="text-xs text-slate-500 font-mono">{new Date(report.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {report.fileUrl && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setViewingReport(report); }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: report._id, type: 'report' }); }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {(user?.role === "admin" ? notifications : reports).length === 0 && <p className="text-slate-400 text-center py-8">No items found.</p>}
                  </div>
                </div>

                {user?.role === "patient" && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-display font-bold text-slate-900">Today's Medications</h3>
                      <button onClick={() => setActiveTab("meds")} className="text-blue-600 text-sm font-semibold hover:underline">Manage</button>
                    </div>
                    <div className="space-y-4">
                      {medications.filter(m => m.active).map(med => (
                        <div key={med._id} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-blue-200 shadow-sm">
                            <Clock className="text-blue-600 w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{med.name}</h4>
                            <p className="text-xs text-blue-600 font-mono font-medium">{formatTime(med.time)} • {med.dosage}</p>
                          </div>
                          <CheckCircle2 className="text-blue-400 w-6 h-6" />
                        </div>
                      ))}
                      {medications.length === 0 && <p className="text-slate-400 text-center py-8">No medications scheduled.</p>}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {user?.role === "admin" ? (
                <div className="space-y-8">
                  <NotificationManager patients={patients} onSend={sendNotification} />
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-6">Sent Notifications</h3>
                    <NotificationList 
                      notifications={notifications} 
                      onDelete={(id) => setConfirmDelete({ id, type: 'notification' })} 
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Upload New Report</h3>
                    <ReportForm onUpload={uploadReport} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map(report => (
                      <div key={report._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <FileText className="text-emerald-600 w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium text-slate-400">{new Date(report.date).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{report.title}</h4>
                        {user?.role === "admin" && <p className="text-xs text-blue-600 font-semibold mb-2">Patient: {report.patientId?.name}</p>}
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{report.description}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setViewingReport(report)}
                            className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> View Report
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ id: report._id, type: 'report' })}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <NotificationList notifications={notifications} />
            </motion.div>
          )}

          {activeTab === "meds" && (
            <motion.div 
              key="meds"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Add Medication</h3>
                <MedicationForm onAdd={addMedication} />
              </div>

              <div className="space-y-4">
                {medications.map(med => (
                  <div key={med._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                      <Clock className="text-blue-600 w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-slate-900">{med.name}</h4>
                        {!med.active && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase">Paused</span>}
                      </div>
                      <p className="text-slate-500 text-sm">{med.dosage} • {formatTime(med.time)}</p>
                      <div className="flex gap-1 mt-2">
                        {med.days.map(day => (
                          <span key={day} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md">{day.slice(0, 3)}</span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfirmDelete({ id: med._id, type: 'med' })}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "patients" && (
            <motion.div 
              key="patients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {selectedPatientId ? (
                <PatientDetailView 
                  patientId={selectedPatientId} 
                  onBack={() => setSelectedPatientId(null)} 
                  onAddMed={addMedication}
                  onEdit={() => setActiveTab("profile")}
                />
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="relative">
                      <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input 
                        type="text"
                        placeholder="Search patients by name, email, phone..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patients
                      .filter(p => 
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.phone?.includes(searchTerm)
                      )
                      .map(patient => (
                        <div 
                          key={patient._id} 
                          onClick={() => setSelectedPatientId(patient._id)}
                          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 group-hover:border-blue-200 transition-colors">
                              <UserIcon className="text-slate-400 w-6 h-6 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 truncate">{patient.name}</h4>
                              <p className="text-xs text-slate-500 truncate">{patient.email}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all" />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedPatientId(patient._id); setActiveTab("profile"); }}
                              className="flex-1 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
                            >
                              Edit Profile
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: patient._id, type: 'patient' }); }}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                              title="Delete Patient"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Sub-components
const SidebarItem = ({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    {icon && <span className={cn("w-5 h-5", active ? "text-white" : "text-slate-400")}>{icon}</span>}
    {label}
  </button>
);

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: ReactNode, color: string }) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", `bg-${color}-50`)}>
        {icon}
      </div>
      <span className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
    <p className="text-3xl font-display font-black text-slate-900">{value}</p>
  </div>
);

const MedicationForm = ({ onAdd }: { onAdd: (med: any) => void }) => {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, dosage, time, days });
    setName(""); setDosage(""); setTime("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input 
          placeholder="Medicine Name" 
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={name} onChange={e => setName(e.target.value)} required
        />
        <input 
          placeholder="Dosage" 
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={dosage} onChange={e => setDosage(e.target.value)} required
        />
      </div>
      <div className="flex gap-3">
        <input 
          type="time"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={time} onChange={e => setTime(e.target.value)} required
        />
        <button type="submit" className="px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-lg shadow-blue-100">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </form>
  );
};

const ReportForm = ({ onUpload }: { onUpload: (report: any) => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    let fileUrl = "";
    if (file) {
      const reader = new FileReader();
      fileUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    onUpload({ title, description, fileUrl, date: new Date().toISOString() });
    setTitle(""); setDescription(""); setFile(null);
    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        placeholder="Report Title" 
        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
        value={title} onChange={e => setTitle(e.target.value)} required
      />
      <textarea 
        placeholder="Description" 
        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
        value={description} onChange={e => setDescription(e.target.value)}
      />
      <div className="flex flex-col md:flex-row items-center gap-4">
        <label className="flex-1 w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all cursor-pointer relative">
          <input type="file" className="hidden" onChange={handleFileChange} accept="application/pdf,image/*" />
          <Upload className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">
            {file ? file.name : "Click to upload file (PDF, Image)"}
          </span>
        </label>
        <button 
          type="submit" 
          disabled={isUploading}
          className="w-full md:w-auto px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all h-[80px] disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Save Report"}
        </button>
      </div>
    </form>
  );
};

// Auth Provider
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Medication Reminders Logic
  useEffect(() => {
    if (!user || user.role !== "patient" || !token) return;

    const checkReminders = async () => {
      try {
        const res = await fetch("/api/medications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meds: Medication[] = await res.json();
        
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

        meds.forEach(med => {
          if (med.active && med.time === currentTime && med.days.includes(currentDay)) {
            toast(`Time for your medicine: ${med.name}`, {
              description: `Dosage: ${med.dosage}`,
              icon: <Bell className="text-blue-600" />,
              duration: 10000,
            });
            
            // Web Notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`Medication Reminder: ${med.name}`, {
                body: `It's time for your ${med.dosage} dose.`,
                icon: "/favicon.ico"
              });
            }
          }
        });
      } catch (err) {
        console.error("Reminder check failed", err);
      }
    };

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};
