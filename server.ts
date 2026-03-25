import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "patient"], default: "patient" },
  profileComplete: { type: Boolean, default: false },
  age: Number,
  gender: String,
  bloodGroup: String,
  phone: String,
  address: String,
  doctorName: String,
  createdAt: { type: Date, default: Date.now },
});

const reportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: String,
  fileUrl: String, // In a real app, this would be a URL to S3/Cloudinary. For now, we'll store base64 or mock.
  date: { type: Date, default: Date.now },
});

const medicationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  dosage: String,
  time: { type: String, required: true }, // e.g., "08:00"
  days: [String], // ["Monday", "Wednesday"]
  active: { type: Boolean, default: true },
});

const notificationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If null, it's for all patients
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["info", "warning", "urgent"], default: "info" },
  date: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Report = mongoose.model("Report", reportSchema);
const Medication = mongoose.model("Medication", medicationSchema);
const Notification = mongoose.model("Notification", notificationSchema);

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// API Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "secret");
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profileComplete: user.profileComplete 
      } 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Profile Routes
app.get("/api/me", authenticate, async (req: any, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

app.put("/api/profile", authenticate, async (req: any, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...req.body, profileComplete: true },
      { new: true }
    ).select("-password");
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      profileComplete: user.profileComplete,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      phone: user.phone,
      address: user.address
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Patient Routes
app.get("/api/patients", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const patients = await User.find({ role: "patient" }).select("-password");
  res.json(patients);
});

app.get("/api/patients/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const patient = await User.findById(req.params.id).select("-password");
  res.json(patient);
});

app.put("/api/patients/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const patient = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    ).select("-password");
    res.json(patient);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/patients/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    await User.findByIdAndDelete(req.params.id);
    // Also delete their reports and medications
    await Promise.all([
      Report.deleteMany({ patientId: req.params.id }),
      Medication.deleteMany({ patientId: req.params.id })
    ]);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Report Routes
app.get("/api/reports", authenticate, async (req: any, res) => {
  let query: any = {};
  if (req.user.role === "admin") {
    if (req.query.patientId) {
      query.patientId = req.query.patientId;
    }
  } else {
    query.patientId = req.user.id;
  }
  const reports = await Report.find(query).populate("patientId", "name email");
  res.json(reports);
});

app.post("/api/reports", authenticate, async (req: any, res) => {
  const report = new Report({ ...req.body, patientId: req.user.id });
  await report.save();
  res.status(201).json(report);
});

app.delete("/api/reports/:id", authenticate, async (req: any, res) => {
  const query = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, patientId: req.user.id };
  await Report.findOneAndDelete(query);
  res.status(204).send();
});

// Medication Routes
app.get("/api/medications", authenticate, async (req: any, res) => {
  let query: any = { patientId: req.user.id };
  if (req.user.role === "admin" && req.query.patientId) {
    query.patientId = req.query.patientId;
  }
  const medications = await Medication.find(query);
  res.json(medications);
});

app.post("/api/medications", authenticate, async (req: any, res) => {
  const patientId = req.user.role === "admin" && req.body.patientId ? req.body.patientId : req.user.id;
  const medication = new Medication({ ...req.body, patientId });
  await medication.save();
  res.status(201).json(medication);
});

app.delete("/api/medications/:id", authenticate, async (req: any, res) => {
  await Medication.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
  res.status(204).send();
});

// Notification Routes
app.get("/api/notifications", authenticate, async (req: any, res) => {
  let query: any = {};
  if (req.user.role === "admin") {
    // Admins see all notifications they sent
    const notifications = await Notification.find().populate("patientId", "name email");
    return res.json(notifications);
  } else {
    // Patients see notifications addressed to them OR to everyone (null patientId)
    query = { $or: [{ patientId: req.user.id }, { patientId: null }] };
    const notifications = await Notification.find(query).sort({ date: -1 });
    return res.json(notifications);
  }
});

app.post("/api/notifications", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  
  const { patientIds, title, message, type } = req.body;
  
  try {
    if (!patientIds || patientIds.length === 0) {
      // Send to ALL
      const notification = new Notification({ title, message, type, patientId: null });
      await notification.save();
      return res.status(201).json(notification);
    } else {
      // Send to specific patients
      const notifications = await Promise.all(patientIds.map(async (pid: string) => {
        const n = new Notification({ title, message, type, patientId: pid });
        return await n.save();
      }));
      return res.status(201).json(notifications);
    }
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/notifications/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  await Notification.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
