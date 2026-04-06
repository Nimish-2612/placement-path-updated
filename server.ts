import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "7f9e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a";

// Google OAuth Setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn("MONGODB_URI not found in environment variables. Database features will not work.");
}

// Schemas
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  displayName: String,
  photoURL: String,
  role: { type: String, default: "user" },
  goals: { type: String, default: "" },
  targetJobs: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  dsaProgress: {
    completedTopics: [String],
    totalXP: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 1 }
  },
  projectCount: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastLogin: { type: Date },
  badges: [String],
  mentalHealthCheckin: {
    score: Number,
    summary: String,
    lastCheckin: Date,
    responses: {
      mentalHealth: Number,
      placementFeelings: Number,
      studyAmount: Number,
      confidence: Number
    }
  }
});

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [String],
  link: String,
  github: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Project = mongoose.model("Project", projectSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);

// Middleware to verify User
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const googleId = req.headers['x-google-id'];

  if (!token && !googleId) return res.sendStatus(401);

  try {
    if (token) {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.sendStatus(401);
      req.user = { id: user._id, email: user.email };
    } else {
      const user = await User.findOne({ googleId });
      if (!user) return res.sendStatus(401);
      req.user = { id: user._id, googleId: user.googleId };
    }
    next();
  } catch (error) {
    res.sendStatus(401);
  }
};

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database is not connected. Please check your MONGODB_URI environment variable." });
  }
  const { email, password, displayName } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, displayName });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database is not connected. Please check your MONGODB_URI environment variable." });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/google/url", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
  }
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "select_account",
  });
  res.json({ url });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("No payload");

    const { sub: googleId, email, name: displayName, picture: photoURL } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.photoURL = photoURL || user.photoURL;
        await user.save();
      } else {
        user = new User({ googleId, email, displayName, photoURL });
        await user.save();
      }
    } else {
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                user: ${JSON.stringify(user)},
                token: '${token}'
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("Authentication failed");
  }
});

// API Routes
app.get("/api/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    database: dbStatus,
    env: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      APP_URL: process.env.APP_URL || "not set (using localhost)",
      JWT_SECRET: !!process.env.JWT_SECRET
    }
  });
});

app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database is not connected. Please check your MONGODB_URI environment variable." });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Streak Logic
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!user.lastLogin) {
      user.streak = 1;
      user.lastLogin = now;
      await user.save();
    } else {
      const lastLoginDate = new Date(user.lastLogin.getFullYear(), user.lastLogin.getMonth(), user.lastLogin.getDate());
      const diffTime = today.getTime() - lastLoginDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak += 1;
        user.lastLogin = now;
        await user.save();
      } else if (diffDays > 1) {
        user.streak = 1;
        user.lastLogin = now;
        await user.save();
      } else if (diffDays === 0) {
        // Already logged in today, keep streak
      }
    }

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/projects", authenticateToken, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database is not connected. Please check your MONGODB_URI environment variable." });
  }
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/projects", authenticateToken, async (req: any, res) => {
  try {
    const project = new Project({ ...req.body, userId: req.user.id });
    await project.save();
    
    // Award XP and update project count
    const xpAwarded = 100;
    const user = await User.findById(req.user.id);
    if (user) {
      user.projectCount += 1;
      if (!user.dsaProgress) {
        user.dsaProgress = { completedTopics: [], totalXP: 0, currentLevel: 1 };
      }
      user.dsaProgress.totalXP += xpAwarded;
      
      // Award badge for first project
      if (user.projectCount === 1 && !user.badges.includes("Project Starter")) {
        user.badges.push("Project Starter");
      }
      // Award badge for 5 projects
      if (user.projectCount === 5 && !user.badges.includes("Project Pro")) {
        user.badges.push("Project Pro");
      }
      
      await user.save();
    }
    
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/projects/:id", authenticateToken, async (req: any, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/projects/:id", authenticateToken, async (req: any, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    await User.findByIdAndUpdate(req.user.id, { $inc: { projectCount: -1 } });
    res.json({ message: "Project deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/feedback", authenticateToken, async (req: any, res) => {
  try {
    const feedback = new Feedback({ ...req.body, userId: req.user.id });
    await feedback.save();
    res.json(feedback);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');

  app.use(express.static(distPath));

  // ✅ ADD THIS LINE (IMPORTANT FIX)
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
