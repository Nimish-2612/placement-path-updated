# 🚀 Placement Path

**Placement Path** is a comprehensive, gamified, and AI-powered platform designed to help students navigate the high-pressure environment of technical placement preparation. It combines rigorous DSA tracking with essential mental health support to ensure students land their dream jobs without burning out.

---

## ✨ Key Features

### 🗺️ Interactive DSA Roadmap
- **Structured Learning**: A curated path covering everything from basic arrays to advanced dynamic programming and graphs.
- **Progress Tracking**: Visualize your journey with an interactive, animated map.
- **Topic Mastery**: Mark topics as completed and earn XP to level up.

### 🧠 Mental Health & Well-being
- **AI Check-ins**: Regular mood tracking and AI-powered feedback using Gemini to help manage placement stress.
- **Emotional Analytics**: Monitor your confidence and stress levels over time.
- **Personalized Support**: Get tailored advice based on your current mental state and preparation progress.

### 🎮 Gamified Experience
- **XP & Levels**: Earn experience points for every problem solved and project added.
- **Daily Streaks**: Stay consistent with a streak system that rewards daily preparation.
- **Achievement Badges**: Unlock badges like "Project Pro" or "DSA Warrior" as you hit milestones.

### 📂 Project Portfolio Manager
- **Showcase Your Work**: Add and manage your personal projects with detailed descriptions and tech stacks.
- **GitHub Integration**: Link directly to your repositories and live demos.
- **XP Rewards**: Get rewarded for building real-world applications.

### 🤖 AI Career Assistant
- **Gemini Integration**: Leverage the power of Google's Gemini AI for personalized guidance.
- **Smart Feedback**: Receive insights on your preparation strategy and project portfolio.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, GSAP.
- **Backend**: Node.js, Express.
- **Database**: MongoDB Atlas (Mongoose).
- **Authentication**: Google OAuth 2.0, JWT (JSON Web Tokens), Bcrypt.js.
- **AI**: Google Gemini API (@google/genai).
- **Routing**: React Router 7.
- **Notifications**: React Toastify.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Google Cloud Project (for OAuth)
- Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/placement-path.git
   cd placement-path
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   APP_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the application**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

---

## 🛡️ Security & Privacy
- **Secure Auth**: Industry-standard JWT and Bcrypt for password hashing.
- **OAuth 2.0**: Secure social login via Google.
- **Protected Routes**: Middleware-level authentication for all sensitive API endpoints.

---

## 📄 License
This project is licensed under the **Apache-2.0 License**.

---

## 🙌 Acknowledgments
- Inspired by the thousands of students striving for excellence in the tech industry.
- Powered by Google Gemini.
