/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/dist/TextPlugin';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { signup, login, getGoogleAuthUrl, getUserProfile, updateUserProfile, getProjects, addProject, updateProject, deleteProject, submitMentalHealthCheckin, updateDSAProgress, submitFeedback } from './api';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin, ScrollTrigger);
}
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TOPIC_QUESTIONS } from './data/questions';
import { 
  Rocket, 
  Map, 
  Gamepad2, 
  Brain, 
  Code2, 
  ChevronRight, 
  Star, 
  CheckCircle2,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Target,
  FileCheck,
  BarChart3,
  LayoutGrid,
  Users,
  Cpu,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Trophy,
  Flame,
  Clock,
  Settings,
  Menu,
  Plus,
  ExternalLink,
  Sparkles,
  X,
  Pencil,
  Heart,
  Smile,
  BookOpen,
  ShieldCheck,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { cn } from './lib/utils';

const SectionReveal = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn("relative", className)}
    >
      {children}
    </motion.section>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (user: any) => void }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { url } = await getGoogleAuthUrl();
      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        toast.error("Popup blocked! Please allow popups for this site.");
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start Google sign in");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isSignup) {
        response = await signup(formData);
        toast.success("Account created successfully!");
      } else {
        response = await login({ email: formData.email, password: formData.password });
        toast.success("Logged in successfully!");
      }
      
      localStorage.setItem("auth_token", response.token);
      onLogin(response.user);
      onClose();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token } = event.data;
        localStorage.setItem("google_id", user.googleId);
        if (token) localStorage.setItem("auth_token", token);
        onLogin(user);
        toast.success("Signed in with Google!");
        onClose();
        setLoading(false);
        navigate('/dashboard');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin, onClose, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-y-auto border border-slate-200 dark:border-zinc-800"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 disabled:opacity-50"
            >
              {loading ? "Processing..." : (isSignup ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 rounded-xl font-bold text-base hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-zinc-400">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ isDark, toggleTheme, user, onLogin, onLogout }: { isDark: boolean, toggleTheme: () => void, user: any, onLogin: () => void, onLogout: () => void }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 transition-colors duration-300">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-zinc-50">PlacementPath</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-500 dark:text-zinc-400 bg-slate-100/50 dark:bg-zinc-900/50 p-1 rounded-full border border-slate-200/50 dark:border-zinc-800/50">
        <a href="#features" className="px-4 py-2 rounded-full hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-all">Features</a>
        <a href="#roadmap" className="px-4 py-2 rounded-full hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-all">Roadmap</a>
        <a href="#testimonials" className="px-4 py-2 rounded-full hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-all">Testimonials</a>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <Link 
            to="/dashboard" 
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        )}
        <button 
          type="button"
          onClick={() => {
            console.log("Theme toggle clicked, current isDark:", isDark);
            toggleTheme();
          }}
          className="relative p-2 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all active:scale-95 z-50"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "dark" : "light"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </AnimatePresence>
        </button>
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 hidden sm:inline-block">
                {user.displayName?.split(' ')[0]}
              </span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={onLogin}
              className="hidden sm:block px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 p-6 flex flex-col gap-4 md:hidden shadow-xl"
          >
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-zinc-400">Features</a>
            <a href="#roadmap" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-zinc-400">Roadmap</a>
            <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-zinc-400">Testimonials</a>
            {!user && (
              <button 
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold"
              >
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const InteractiveBackground = ({ isDark }: { isDark: boolean }) => {
  const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 });
  
  // Slower springs for background depth
  const mouseXSlow = useSpring(0, { stiffness: 20, damping: 40 });
  const mouseYSlow = useSpring(0, { stiffness: 20, damping: 40 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      mouseXSlow.set(e.clientX);
      mouseYSlow.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, mouseXSlow, mouseYSlow]);

  const blob1X = useTransform(mouseX, [0, 1920], [-150, 150]);
  const blob1Y = useTransform(mouseY, [0, 1080], [-150, 150]);
  
  const blob2X = useTransform(mouseX, [0, 1920], [150, -150]);
  const blob2Y = useTransform(mouseY, [0, 1080], [150, -150]);
  
  const blob3X = useTransform(mouseXSlow, [0, 1920], [-80, 80]);
  const blob3Y = useTransform(mouseYSlow, [0, 1080], [80, -80]);
  
  const blob4X = useTransform(mouseXSlow, [0, 1920], [120, -120]);
  const blob4Y = useTransform(mouseYSlow, [0, 1080], [-120, 120]);

  const gridX = useTransform(mouseX, [0, 1920], [-20, 20]);
  const gridY = useTransform(mouseY, [0, 1080], [-20, 20]);

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Large Blobs */}
      <motion.div 
        style={{ x: blob1X, y: blob1Y }}
        className={cn(
          "absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[140px] transition-colors duration-500",
          isDark ? "bg-indigo-600/10" : "bg-indigo-200/30"
        )} 
      />
      <motion.div 
        style={{ x: blob2X, y: blob2Y }}
        className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-colors duration-500",
          isDark ? "bg-purple-600/10" : "bg-purple-200/30"
        )} 
      />
      
      {/* Secondary Blobs for more depth */}
      <motion.div 
        style={{ x: blob3X, y: blob3Y }}
        className={cn(
          "absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-500",
          isDark ? "bg-blue-500/5" : "bg-blue-200/20"
        )} 
      />
      <motion.div 
        style={{ x: blob4X, y: blob4Y }}
        className={cn(
          "absolute bottom-[20%] left-[10%] w-[45%] h-[45%] rounded-full blur-[110px] transition-colors duration-500",
          isDark ? "bg-indigo-400/5" : "bg-indigo-200/20"
        )} 
      />

      {/* Reactive Dot Grid */}
      <motion.div 
        style={{ x: gridX, y: gridY }}
        className="absolute inset-[-5%] opacity-[0.4] dark:opacity-[0.15]"
      >
        <div className="w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:40px_40px]" />
      </motion.div>

      <div className={cn(
        "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.01] dark:opacity-[0.02] transition-all duration-300",
        !isDark && "invert"
      )} />
    </div>
  );
};

const Hero = ({ isDark, onLogin, user }: { isDark: boolean, onLogin: () => void, user: any }) => {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const { scrollY } = useScroll();
  const imageScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      onLogin();
    }
  };

  useEffect(() => {
    // ... GSAP animations
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power4.out", delay: 0.2 }
      );
    }
    if (subtitleRef.current) {
      gsap.fromTo(
        subtitleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power4.out", delay: 0.5 }
      );
    }

    // Typewriter effect
    const words = ["BIG LEAGUE.", "DREAM JOB.", "TOP TECH.", "FUTURE."];
    let mainTimeline = gsap.timeline({ repeat: -1 });

    words.forEach((word) => {
      let textTimeline = gsap.timeline({
        repeat: 1,
        yoyo: true,
        repeatDelay: 2,
      });

      textTimeline.to(typewriterRef.current, {
        duration: word.length * 0.1,
        text: word,
        onUpdate: function() {
          if (typewriterRef.current) {
            typewriterRef.current.innerText = word.substring(0, Math.ceil(this.progress() * word.length));
          }
        },
        ease: "none",
      });

      mainTimeline.add(textTimeline);
    });

    // Cursor blink
    gsap.to(cursorRef.current, {
      opacity: 0,
      ease: "power2.inOut",
      repeat: -1,
      duration: 0.5,
      yoyo: true
    });

    return () => {
      mainTimeline.kill();
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
      {/* Large Background Image for Hero */}
      <motion.div 
        style={{ scale: imageScale }}
        className="absolute inset-0 -z-30 opacity-10 dark:opacity-20"
      >
        <img 
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" 
          alt="Tech Workspace" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-transparent to-slate-50 dark:from-zinc-950 dark:via-transparent dark:to-zinc-950 transition-colors duration-300" />
      </motion.div>

      <div className="max-w-5xl w-full text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm transition-colors duration-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Next-Gen Placement Prep
        </motion.div>
        
        <h1 
          ref={titleRef}
          className="text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tighter leading-[0.9] mb-8 text-slate-900 dark:text-zinc-50 transition-colors duration-300"
        >
          CRACK THE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 min-h-[1em] inline-block">
            <span ref={typewriterRef}>BIG LEAGUE.</span>
            <span ref={cursorRef} className="text-indigo-600 dark:text-indigo-400 ml-1">|</span>
          </span>
        </h1>
        
        <p 
          ref={subtitleRef}
          className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-colors duration-300"
        >
          The ultimate structured roadmap for technical placements. Gamified DSA, 
          mental health check-ins, and real-time progress tracking.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="#roadmap"
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-zinc-50 rounded-xl font-bold border border-slate-200 dark:border-zinc-800 transition-all shadow-sm text-center"
          >
            View Roadmap
          </a>
        </div>
      </div>
    </section>
  );
};

const ExhaustingSection = () => {
  return (
    <SectionReveal className="py-32 px-6 bg-white dark:bg-zinc-950 relative overflow-hidden transition-colors duration-300">
      {/* Background Image for Exhausting Section */}
      <div className="absolute inset-0 -z-10 opacity-5 dark:opacity-10 grayscale">
        <img 
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=2000" 
          alt="Exhausted Student" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-50/40 dark:bg-zinc-950/60" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 text-slate-900 dark:text-zinc-50">Why Placement Prep is <br className="hidden md:block" /> Exhausting</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">Most placement tools only test you. They don’t guide you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-8 rounded-3xl bg-white/50 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 backdrop-blur-sm shadow-sm transition-all">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-zinc-50">No Clear Path</h3>
            <p className="text-slate-500 dark:text-zinc-500 leading-relaxed">Jumping between tutorials and topics with no clear structure or end goal in sight.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white/50 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 backdrop-blur-sm shadow-sm transition-all">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-zinc-50">Constant Pressure</h3>
            <p className="text-slate-500 dark:text-zinc-500 leading-relaxed">Rankings and competitive platforms create anxiety, making learning feel like a race.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white/50 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 backdrop-blur-sm shadow-sm transition-all">
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-zinc-50">Uncertain Progress</h3>
            <p className="text-slate-500 dark:text-zinc-500 leading-relaxed">It's hard to know if you're truly making progress or just staying busy.</p>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
};

const MentalWellbeing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as any,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <SectionReveal className="py-32 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-slate-900 dark:text-zinc-50">It’s not just about skills.</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            PlacementPath is built to support your mental well-being throughout the 
            demanding preparation process.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: "Confidence Tracking",
              desc: "Rate your confidence on topics and projects to see your self-assurance grow.",
            },
            {
              title: "Motivation Reminders",
              desc: "Maintain momentum with weekly consistency scores and activity heatmaps.",
            },
            {
              title: "Progress Encouragement",
              desc: "Get AI-powered suggestions and celebrate milestones as you hit them.",
            }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              variants={cardVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="p-10 rounded-3xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/50 hover:border-indigo-200 dark:hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-center group shadow-sm"
            >
              <h3 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</h3>
              <p className="text-slate-500 dark:text-zinc-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionReveal>
  );
};

const FeatureGrid = () => {
  const features = [
    { icon: Target, label: "DSA Tracker" },
    { icon: FileCheck, label: "Project Scoring" },
    { icon: BarChart3, label: "Progress Analytics" },
    { icon: LayoutGrid, label: "Skill Gap Detection" },
    { icon: Users, label: "User Profiles" },
    { icon: Cpu, label: "AI Readiness Score" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0, scale: 0.5 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as any,
        stiffness: 300,
        damping: 15,
      },
    },
  };

  return (
    <SectionReveal className="py-32 px-6 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 relative overflow-hidden transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-display font-bold mb-20 text-slate-900 dark:text-zinc-50"
        >
          Everything you need, in one place.
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12"
        >
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="flex flex-col items-center gap-4 group cursor-default"
            >
              <motion.div 
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className="relative w-20 h-20 flex items-center justify-center"
              >
                {/* Rotating glow effect on hover */}
                <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                
                <div className="relative w-full h-full rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:shadow-lg group-hover:shadow-indigo-500/10 transition-all duration-300 shadow-sm">
                  <feature.icon className="w-8 h-8 text-slate-400 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                </div>
              </motion.div>
              
              <motion.span 
                className="text-sm font-bold text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors duration-300 tracking-tight"
              >
                {feature.label}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionReveal>
  );
};

const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
      className="p-8 rounded-3xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group shadow-sm"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-lg", color)}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-zinc-50">{title}</h3>
      <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const Features = () => {
  return (
    <SectionReveal id="features" className="py-32 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 text-slate-900 dark:text-zinc-50">Everything you need to <br /> land your dream job.</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">We've built a comprehensive ecosystem that takes care of your technical skills and mental well-being.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={Map}
            title="Structured Roadmap"
            description="A step-by-step guide from basics to advanced topics, tailored for top-tier tech companies."
            color="bg-blue-600"
          />
          <FeatureCard 
            icon={Gamepad2}
            title="Gamified Prep"
            description="Earn XP, unlock badges, and climb the leaderboard as you solve complex DSA problems."
            color="bg-purple-600"
          />
          <FeatureCard 
            icon={Brain}
            title="Mental Health"
            description="Daily check-ins and mindfulness exercises to keep you calm and focused during prep."
            color="bg-emerald-600"
          />
          <FeatureCard 
            icon={Code2}
            title="DSA Tracking"
            description="Detailed analytics of your problem-solving speed, accuracy, and consistency."
            color="bg-orange-600"
          />
        </div>
      </div>
    </SectionReveal>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      name: "Ananya Sharma",
      role: "SDE at Google",
      content: "PlacementPath's roadmap was a lifesaver. I didn't have to waste time searching for what to study next.",
      avatar: "https://i.pravatar.cc/150?u=ananya"
    },
    {
      name: "Rohan Das",
      role: "SDE at Amazon",
      content: "The gamified approach kept me motivated. Solving DSA felt like playing a game rather than a chore.",
      avatar: "https://i.pravatar.cc/150?u=rohan"
    },
    {
      name: "Sanya Malhotra",
      role: "SDE at Microsoft",
      content: "The daily mental health check-ins helped me manage my anxiety during the peak placement season.",
      avatar: "https://i.pravatar.cc/150?u=sanya"
    }
  ];

  return (
    <SectionReveal id="testimonials" className="py-32 px-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 text-slate-900 dark:text-zinc-50">Trusted by thousands <br /> of successful students.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-lg italic mb-8">"{t.content}"</p>
              </div>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border-2 border-indigo-100 dark:border-indigo-900 shadow-sm" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-zinc-50">{t.name}</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
};

const CTA = ({ onLogin, user }: { onLogin: () => void, user: any }) => {
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      onLogin();
    }
  };

  return (
    <SectionReveal className="py-32 px-6 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto rounded-[40px] bg-indigo-600 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-900/40">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-7xl font-display font-bold text-white mb-8">Ready to land your <br /> dream offer?</h2>
          <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Join 50,000+ students who are already using PlacementPath to supercharge their careers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleCTA}
              className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-xl"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
};

const Footer = () => {
  return (
    <footer className="py-20 px-6 border-t border-slate-200 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-zinc-50">PlacementPath</span>
          </div>
          <p className="text-slate-500 dark:text-zinc-500 max-w-sm mb-8 leading-relaxed">
            Empowering the next generation of software engineers with the tools and mindset to succeed in the tech industry.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Github className="w-5 h-5" /></a>
            <a href="#" className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-zinc-50">Platform</h4>
          <ul className="space-y-4 text-slate-500 dark:text-zinc-500 text-sm">
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Roadmap</a></li>
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">DSA Tracker</a></li>
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Gamification</a></li>
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Mental Health</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-zinc-50">Company</h4>
          <ul className="space-y-4 text-slate-500 dark:text-zinc-500 text-sm">
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 dark:border-zinc-900 text-center text-slate-400 dark:text-zinc-600 text-sm">
        © 2026 PlacementPath. All rights reserved.
      </div>
    </footer>
  );
};

const FeaturesTour = () => {
  const tourData = [
    {
      title: "Structured Roadmap",
      description: "A step-by-step guide from foundations to advanced DSA and Core CS subjects. Never feel lost again.",
      icon: Map,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=1000"
    },
    {
      title: "Gamified Preparation",
      description: "Earn XP, unlock badges, and maintain streaks. Turn the boring grind into an exciting quest for mastery.",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1000"
    },
    {
      title: "Mental Health Check-ins",
      description: "Daily check-ins to monitor your stress and confidence. Because a healthy mind is your best tool for success.",
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      image: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=1000"
    },
    {
      title: "DSA Tracking",
      description: "Track your progress across 150+ curated problems. Visualize your growth and identify areas that need focus.",
      icon: Brain,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=1000"
    }
  ];

  return (
    <section className="py-32 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold text-slate-900 dark:text-zinc-50 mb-6"
          >
            Take the <span className="text-indigo-600">Grand Tour</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Everything you need to crack your dream placement, all in one place.
          </motion.p>
        </div>

        <div className="space-y-32">
          {tourData.map((feature, index) => (
            <div key={index} className={cn(
              "flex flex-col lg:flex-row items-center gap-12 lg:gap-24",
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            )}>
              <motion.div 
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex-1"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8", feature.bgColor)}>
                  <feature.icon className={cn("w-8 h-8", feature.color)} />
                </div>
                <h3 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-zinc-50 mb-6">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
                  {feature.description}
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Feature 0{index + 1}</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: index % 2 === 0 ? 5 : -5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex-1 relative group"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative rounded-[40px] overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-2xl">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-[300px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LandingPage = ({ isDark, toggleTheme, user, onLogin, onLogout }: { isDark: boolean, toggleTheme: () => void, user: any, onLogin: () => void, onLogout: () => void }) => {
  if (user) return <Navigate to="/dashboard" />;
  
  return (
    <>
      <Navbar isDark={isDark} toggleTheme={toggleTheme} user={user} onLogin={onLogin} onLogout={onLogout} />
      <main>
        <Hero isDark={isDark} onLogin={onLogin} user={user} />
        <ExhaustingSection />
        <MentalWellbeing />
        <FeaturesTour />
        <FeatureGrid />
        <Features />
        <Testimonials />
        <CTA onLogin={onLogin} user={user} />
      </main>
      <Footer />
    </>
  );
};

const DSA_TOPICS = [
  { id: 'arrays', title: 'Arrays & Hashing', xp: 100, x: 1, y: 1 },
  { id: 'pointers', title: 'Two Pointers', xp: 150, x: 3, y: 1 },
  { id: 'sliding', title: 'Sliding Window', xp: 200, x: 3, y: 3 },
  { id: 'stack', title: 'Stack', xp: 150, x: 1, y: 3 },
  { id: 'binary', title: 'Binary Search', xp: 250, x: 1, y: 5 },
  { id: 'linked', title: 'Linked List', xp: 200, x: 3, y: 5 },
  { id: 'trees', title: 'Trees', xp: 300, x: 5, y: 5 },
  { id: 'tries', title: 'Tries', xp: 350, x: 5, y: 3 },
  { id: 'backtracking', title: 'Backtracking', xp: 400, x: 7, y: 3 },
  { id: 'graphs', title: 'Graphs', xp: 450, x: 7, y: 5 },
  { id: 'adv-graphs', title: 'Advanced Graphs', xp: 500, x: 9, y: 5 },
  { id: 'dp', title: 'Dynamic Programming', xp: 600, x: 9, y: 3 },
  { id: 'greedy', title: 'Greedy', xp: 300, x: 9, y: 1 },
  { id: 'bit', title: 'Bit Manipulation', xp: 250, x: 7, y: 1 },
];

const DSATracker = ({ user, isDark, toggleTheme, onLogout }: { user: any, isDark: boolean, toggleTheme: () => void, onLogout: () => void }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const progress = user.dsaProgress || { completedTopics: [], totalXP: 0, currentLevel: 1 };
  const currentTopicIndex = progress.completedTopics.length;
  const [activeTopicIndex, setActiveTopicIndex] = useState(currentTopicIndex);
  const currentTopic = DSA_TOPICS[activeTopicIndex] || DSA_TOPICS[DSA_TOPICS.length - 1];

  const [isWalking, setIsWalking] = useState(false);
  const [prevTopicIndex, setPrevTopicIndex] = useState(activeTopicIndex);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [frameIndex, setFrameIndex] = useState(1);
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTopicPos = (topic: any, index: number) => {
    if (isMobile) {
      // Vertical layout: alternate x, increment y
      const x = index % 2 === 0 ? 25 : 75;
      const y = (index + 0.5) * (100 / DSA_TOPICS.length);
      return { x, y };
    }
    return { x: topic.x * 10, y: topic.y * 15 };
  };

  // Animation frame loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev % 15) + 1);
    }, 80); // ~12.5 FPS for smooth animation
    return () => clearInterval(interval);
  }, []);

  // Pre-load images
  useEffect(() => {
    const states = ['Idle', 'Walk'];
    states.forEach(state => {
      for (let i = 1; i <= 15; i++) {
        const img = new Image();
        img.src = `/${state} (${i}).png`;
      }
    });
  }, []);

  // Update active topic when progress changes
  useEffect(() => {
    setActiveTopicIndex(currentTopicIndex);
  }, [currentTopicIndex]);

  useEffect(() => {
    if (activeTopicIndex !== prevTopicIndex) {
      const prevTopic = DSA_TOPICS[prevTopicIndex] || DSA_TOPICS[0];
      const nextTopic = DSA_TOPICS[activeTopicIndex] || DSA_TOPICS[0];
      
      if (nextTopic.x < prevTopic.x) {
        setDirection(-1);
      } else if (nextTopic.x > prevTopic.x) {
        setDirection(1);
      }

      setIsWalking(true);
      const timer = setTimeout(() => setIsWalking(false), 1500); // Duration of walk animation
      setPrevTopicIndex(activeTopicIndex);
      return () => clearTimeout(timer);
    }
  }, [activeTopicIndex, prevTopicIndex]);

  const handleComplete = async (topicId: string, xp: number) => {
    if (progress.completedTopics.includes(topicId)) return;
    try {
      const updatedTopics = [...progress.completedTopics, topicId];
      const updatedXP = progress.totalXP + xp;
      const updatedProgress = {
        ...progress,
        completedTopics: updatedTopics,
        totalXP: updatedXP,
        currentLevel: Math.floor(updatedXP / 1000) + 1
      };
      await updateDSAProgress(updatedProgress);
      toast.success(`Level Completed! +${xp} XP`);
      setSelectedTopic(null);
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleUncomplete = async (topicId: string, xp: number) => {
    if (!progress.completedTopics.includes(topicId)) return;
    try {
      const updatedTopics = progress.completedTopics.filter((id: string) => id !== topicId);
      const updatedXP = Math.max(0, progress.totalXP - xp);
      const updatedProgress = {
        ...progress,
        completedTopics: updatedTopics,
        totalXP: updatedXP,
        currentLevel: Math.floor(updatedXP / 1000) + 1
      };
      await updateDSAProgress(updatedProgress);
      toast.info(`Level Reverted. -${xp} XP`);
      setSelectedTopic(null);
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="DSA Tracker"
        onLogout={onLogout}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          title="DSA Quest"
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-zinc-50 mb-2">DSA Mastery Quest</h1>
                <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base">Walk the path of algorithms and unlock your potential.</p>
              </div>
              <div className="flex items-center gap-6 p-4 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total XP</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{progress.totalXP}</p>
                </div>
                <div className="w-px h-10 bg-slate-100 dark:bg-zinc-800" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Topics</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50">{progress.completedTopics.length}/{DSA_TOPICS.length}</p>
                </div>
              </div>
            </div>

            <div className="pb-12">
              <div className={cn(
                "relative bg-slate-100 dark:bg-zinc-900/50 rounded-[40px] border-4 border-white dark:border-zinc-800 shadow-2xl overflow-visible p-8 mx-auto",
                isMobile ? "w-full min-h-[1200px]" : "w-[1000px] aspect-[16/9]"
              )}>
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20 dark:opacity-10 rounded-[36px] overflow-hidden" style={{ 
                  backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
                }} />

                {/* Path Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {DSA_TOPICS.map((topic, i) => {
                    if (i === 0) return null;
                    const prev = DSA_TOPICS[i - 1];
                    const isCompleted = progress.completedTopics.includes(prev.id);
                    const start = getTopicPos(prev, i - 1);
                    const end = getTopicPos(topic, i);
                    return (
                      <line 
                        key={i}
                        x1={`${start.x}%`} y1={`${start.y}%`}
                        x2={`${end.x}%`} y2={`${end.y}%`}
                        stroke={isCompleted ? "#6366f1" : "#e2e8f0"}
                        strokeWidth="4"
                        strokeDasharray={isCompleted ? "0" : "8 8"}
                        className="transition-all duration-1000"
                      />
                    );
                  })}
                </svg>

                {/* Checkpoints */}
                {DSA_TOPICS.map((topic, i) => {
                  const isCompleted = progress.completedTopics.includes(topic.id);
                  const isCurrent = i === progress.completedTopics.length;
                  const isLocked = i > progress.completedTopics.length;
                  const pos = getTopicPos(topic, i);

                  return (
                    <motion.button
                      key={topic.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedTopic(topic);
                          setActiveTopicIndex(i);
                        }
                      }}
                      className={cn(
                        "absolute w-12 h-12 -ml-6 -mt-6 rounded-2xl flex items-center justify-center transition-all z-10",
                        isCompleted ? "bg-indigo-600 shadow-lg shadow-indigo-500/50 ring-4 ring-indigo-600/20" : 
                        isCurrent ? "bg-white dark:bg-zinc-800 border-4 border-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]" :
                        "bg-slate-200 dark:bg-zinc-800 cursor-not-allowed opacity-60"
                      )}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6 text-white" /> : 
                       isLocked ? <Clock className="w-5 h-5 text-slate-400" /> :
                       <Star className="w-6 h-6 text-indigo-600" />}
                      
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded-lg",
                          isCompleted ? "text-indigo-600 dark:text-indigo-400" :
                          isCurrent ? "text-slate-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 shadow-sm" :
                          "text-slate-400"
                        )}>
                          {topic.title}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Character */}
                <motion.div
                  animate={{ 
                    left: `${getTopicPos(currentTopic, activeTopicIndex).x}%`, 
                    top: `${getTopicPos(currentTopic, activeTopicIndex).y}%`,
                    scale: isWalking ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ 
                    left: { type: "spring", stiffness: 40, damping: 20 },
                    top: { type: "spring", stiffness: 40, damping: 20 },
                    scale: { repeat: isWalking ? Infinity : 0, duration: 0.4 }
                  }}
                  className="absolute w-24 h-24 -ml-12 -mt-20 z-20 pointer-events-none"
                >
                  <div className="relative w-full h-full">
                    <motion.div 
                      animate={{ y: 0 }}
                      transition={{ repeat: Infinity, duration: isWalking ? 0.3 : 2 }}
                      className="relative w-full h-full"
                    >
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg z-30">
                        LVL {progress.currentLevel}
                      </div>
                      <img 
                        src={isWalking ? `/Walk (${frameIndex}).png` : `/Idle (${frameIndex}).png`}
                        alt="Character" 
                        className="w-full h-full object-contain transition-transform duration-300 drop-shadow-2xl"
                        style={{ transform: `scaleX(${direction})` }}
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                    {/* Shadow */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 blur-md rounded-full" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Topic Detail Modal */}
            <AnimatePresence>
              {selectedTopic && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedTopic(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[40px] p-6 sm:p-10 shadow-2xl border border-slate-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0">
                        <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-3xl font-display font-bold text-slate-900 dark:text-zinc-50">{selectedTopic.title}</h3>
                        <p className="text-indigo-600 font-bold text-sm sm:text-base">+{selectedTopic.xp} XP Points</p>
                      </div>
                    </div>

                    <div className="space-y-6 mb-10">
                      <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Master the fundamentals of {selectedTopic.title}. This module covers essential patterns, 
                        time complexity analysis, and common interview problems.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Difficulty</p>
                          <p className="font-bold text-slate-900 dark:text-zinc-50">Medium</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Est. Time</p>
                          <p className="font-bold text-slate-900 dark:text-zinc-50">4-6 Hours</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => navigate(`/dsa-tracker/${selectedTopic.id}`)}
                        className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                      >
                        Start Learning
                      </button>
                      <button 
                        onClick={() => {
                          if (progress.completedTopics.includes(selectedTopic.id)) {
                            handleUncomplete(selectedTopic.id, selectedTopic.xp);
                          } else {
                            handleComplete(selectedTopic.id, selectedTopic.xp);
                          }
                        }}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg",
                          progress.completedTopics.includes(selectedTopic.id) 
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200 dark:shadow-none"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                        )}
                      >
                        {progress.completedTopics.includes(selectedTopic.id) ? "Un-complete" : "Mark Done"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

const DashboardHeader = ({ isDark, toggleTheme, isSidebarCollapsed, setIsSidebarCollapsed, setIsMobileMenuOpen, user, title }: any) => (
  <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <Rocket className="w-5 h-5 text-white" />
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 truncate max-w-[120px] sm:max-w-none">{title || "Dashboard"}</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-lg" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
          <span className="text-sm font-bold text-slate-900 dark:text-zinc-50 hidden md:block">{user.displayName?.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  </header>
);

const Sidebar = ({ user, isDark, toggleTheme, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, activeItem, onLogout }: any) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
    { icon: Map, label: "Roadmap", path: "/roadmap" },
    { icon: Brain, label: "DSA Tracker", path: "/dsa-tracker" },
    { icon: BookOpen, label: "Core Subjects", path: "/core-subjects" },
    { icon: Code2, label: "Projects", path: "/projects" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 z-50 flex flex-col transition-all duration-300 lg:translate-x-0",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("flex items-center p-6 mb-4", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-zinc-50 truncate">PlacementPath</span>
            )}
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-2 text-slate-500">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item, i) => (
            <button 
              key={i}
              onClick={() => {
                navigate(item.path);
                setIsMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeItem === item.label 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-300",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
          {!isCollapsed && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          )}
          {isCollapsed && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

const MentalHealthCheckin = ({ user, onClose, onComplete }: { user: any, onClose: () => void, onComplete?: (updatedUser: any) => void }) => {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({
    mentalHealth: 3,
    placementFeelings: 3,
    studyAmount: 3,
    confidence: 3
  });

  const questions = [
    { 
      id: 'mentalHealth', 
      label: 'How are you feeling mentally today?', 
      icon: Heart, 
      options: ['Struggling', 'Okay', 'Good', 'Great', 'Amazing'] 
    },
    { 
      id: 'placementFeelings', 
      label: 'How are you feeling about your upcoming placements?', 
      icon: Smile, 
      options: ['Anxious', 'Neutral', 'Hopeful', 'Confident', 'Excited'] 
    },
    { 
      id: 'studyAmount', 
      label: 'How much have you studied in the past week?', 
      icon: BookOpen, 
      options: ['None', 'A little', 'Moderate', 'A lot', 'Intense'] 
    },
    { 
      id: 'confidence', 
      label: 'How confident are you feeling about your preparation?', 
      icon: ShieldCheck, 
      options: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'] 
    }
  ];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const totalScore = (Object.values(responses) as number[]).reduce((a, b) => a + b, 0);
    const finalScore = (totalScore / 20) * 100;
    
    let summary = "";
    if (finalScore >= 80) summary = "You're in a great headspace! Keep up the momentum.";
    else if (finalScore >= 60) summary = "You're doing well. Stay focused and balanced.";
    else if (finalScore >= 40) summary = "You're making progress, but remember to take breaks.";
    else summary = "Take some time for yourself. Mental health is as important as preparation.";

    try {
      const updatedUser = await submitMentalHealthCheckin({
        score: Math.round(finalScore),
        summary,
        responses
      });
      toast.success("Check-in completed!");
      if (onComplete) onComplete(updatedUser);
      onClose();
    } catch (error) {
      toast.error("Failed to submit check-in.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-y-auto border border-slate-200 dark:border-zinc-800"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            {React.createElement(questions[step].icon, { className: "w-8 h-8" })}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Mental Check-in</h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">{questions[step].label}</p>
          
          <div className="grid grid-cols-1 gap-3 mb-8">
            {questions[step].options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setResponses({ ...responses, [questions[step].id]: i + 1 })}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all font-bold text-left flex items-center justify-between",
                  responses[questions[step].id as keyof typeof responses] === i + 1
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600"
                    : "border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 hover:border-indigo-200"
                )}
              >
                {option}
                {responses[questions[step].id as keyof typeof responses] === i + 1 && <CheckCircle2 className="w-5 h-5" />}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === step ? "w-6 bg-indigo-600" : "bg-slate-200 dark:bg-zinc-800")} />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              {step === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CORE_SUBJECTS = [
  {
    id: 'oops',
    title: 'Object Oriented Programming (OOPS)',
    description: 'The foundation of modern software development. Focus on real-world modeling.',
    topics: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'Interfaces'],
    resources: [
      { name: 'GeeksforGeeks OOPS', url: 'https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/' },
      { name: 'JavaTpoint OOPS', url: 'https://www.javatpoint.com/cpp-oops-concepts' }
    ]
  },
  {
    id: 'dbms',
    title: 'Database Management Systems (DBMS)',
    description: 'Learn how to store, retrieve, and manage data efficiently.',
    topics: ['ER Model', 'Relational Algebra', 'SQL Queries', 'Normalization (1NF, 2NF, 3NF, BCNF)', 'Indexing', 'Transactions & ACID'],
    resources: [
      { name: 'GateSmashers DBMS Playlist', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8KuIs_zONzVXpau72' },
      { name: 'SQLZoo Practice', url: 'https://sqlzoo.net/' }
    ]
  },
  {
    id: 'os',
    title: 'Operating Systems (OS)',
    description: 'Understand the bridge between hardware and software.',
    topics: ['Process Management', 'CPU Scheduling', 'Process Synchronization', 'Deadlocks', 'Memory Management', 'Virtual Memory'],
    resources: [
      { name: 'Operating System Concepts (Silberschatz)', url: 'https://codex.cs.yale.edu/os-book/os10/slide-dir/index.html' },
      { name: 'GateSmashers OS Playlist', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p' }
    ]
  },
  {
    id: 'cn',
    title: 'Computer Networks (CN)',
    description: 'How computers communicate across the globe.',
    topics: ['OSI Model', 'TCP/IP Model', 'IP Addressing', 'Routing Algorithms', 'HTTP/HTTPS', 'DNS'],
    resources: [
      { name: 'Computer Networking (Kurose & Ross)', url: 'https://gaia.cs.umass.edu/kurose_ross/index.php' },
      { name: 'GateSmashers CN Playlist', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_' }
    ]
  }
];

const CoreSubjectsPage = ({ user, isDark, toggleTheme, onLogout }: any) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="Core Subjects"
        onLogout={onLogout}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          title="Core CS Subjects"
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {/* Roadmap Header */}
            <section className="mb-12 p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Target className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-display font-bold mb-4">How to Approach Core Subjects?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3 font-bold">1</div>
                    <p className="text-sm font-medium">Understand concepts first. Don't just memorize definitions.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3 font-bold">2</div>
                    <p className="text-sm font-medium">Focus on interview-frequent topics like Normalization and Deadlocks.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3 font-bold">3</div>
                    <p className="text-sm font-medium">Practice standard interview questions for each subject.</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {CORE_SUBJECTS.map((subject) => (
                <motion.section 
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group"
                >
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-4 group-hover:text-indigo-600 transition-colors">{subject.title}</h3>
                  <p className="text-slate-500 dark:text-zinc-400 mb-6">{subject.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {subject.topics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Resources</h4>
                    <div className="space-y-2">
                      {subject.resources.map((res, i) => (
                        <a 
                          key={i} 
                          href={res.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all group/link"
                        >
                          <span className="font-bold text-sm">{res.name}</span>
                          <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SettingsPage = ({ user, isDark, toggleTheme, onLogout, setUser }: any) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    goals: user.goals || "",
    targetJobs: user.targetJobs || ""
  });
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({ content: feedback, rating });
      setFeedback("");
      setRating(5);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      toast.error("Failed to submit feedback.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="Settings"
        onLogout={onLogout}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          title="Settings"
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                Profile Settings
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Your Goals</label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                    placeholder="e.g., Master Dynamic Programming, Get into FAANG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Target Jobs</label>
                  <input
                    type="text"
                    value={formData.targetJobs}
                    onChange={(e) => setFormData({ ...formData, targetJobs: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g., SDE-1 at Google, Frontend Engineer at Stripe"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </section>

            <section className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                Platform Feedback
              </h2>
              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          rating >= star ? "text-yellow-500" : "text-slate-300 dark:text-zinc-700"
                        )}
                      >
                        <Star className={cn("w-6 h-6", rating >= star && "fill-current")} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Your Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none"
                    placeholder="Tell us what you like or what we can improve..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

const Dashboard = ({ user, isDark, toggleTheme, onLogout, setUser }: { user: any, isDark: boolean, toggleTheme: () => void, onLogout: () => void, setUser: (user: any) => void }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!user) return <Navigate to="/" />;

  const progress = user.dsaProgress || { completedTopics: [], totalXP: 0, currentLevel: 1 };
  const checkin = user.mentalHealthCheckin;

  const handleGetAIAssistance = async () => {
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are an AI career coach for a student preparing for software engineering placements.
        Assess the user's current state based on the following data:
        1. Total XP (DSA Practice): ${progress.totalXP}
        2. Topics Mastered: ${progress.completedTopics.length}
        3. Projects Submitted: ${user.projectCount || 0}
        4. Mental Health Score: ${checkin?.score || 'Not checked in yet'}
        5. Mental Health Summary: ${checkin?.summary || 'N/A'}
        
        Available DSA Topics: ${DSA_TOPICS.map(t => t.title).join(', ')}
        Completed Topics: ${progress.completedTopics.map(id => DSA_TOPICS.find(t => t.id === id)?.title).join(', ')}

        Based on this data:
        1. Give a very brief assessment of their current placement readiness.
        2. Suggest exactly one next DSA topic to focus on based on their current mental state and progress.
        
        Provide the response in Markdown format. Keep it extremely concise (max 3-4 sentences).
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setAiResponse(response.text || "I couldn't generate a response at this time.");
    } catch (error) {
      console.error("AI Assistance Error:", error);
      toast.error("Failed to get AI assistance. Please try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const lastCheckin = user.mentalHealthCheckin?.lastCheckin;
      if (!lastCheckin) {
        setShowCheckin(true);
      } else {
        const today = new Date().toDateString();
        const checkinDate = new Date(lastCheckin).toDateString();
        if (today !== checkinDate) {
          setShowCheckin(true);
        }
      }
    }
  }, [user]);
  
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="Overview"
        onLogout={onLogout}
      />

      <AnimatePresence>
        {showCheckin && <MentalHealthCheckin user={user} onClose={() => setShowCheckin(false)} onComplete={(updatedUser) => setUser(updatedUser)} />}
      </AnimatePresence>

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-zinc-50 mb-2">
                  Welcome back, {user.displayName?.split(' ')[0]}! 👋
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 mb-6">Here's your placement preparation overview.</p>
                <button 
                  onClick={handleGetAIAssistance}
                  disabled={isAiLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Get AI Preparation Insight
                </button>
              </div>
              
              {checkin && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 max-w-md relative group"
                >
                  <button 
                    onClick={() => setShowCheckin(true)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Check-in"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Mental Health Score</p>
                      <p className="text-2xl font-bold">{checkin.score}/100</p>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-50 leading-relaxed">{checkin.summary}</p>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-12 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-500/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-24 h-24 text-indigo-600" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50">AI Career Coach Insight</h3>
                      <button 
                        onClick={() => setAiResponse(null)}
                        className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <div className="prose dark:prose-invert prose-indigo max-w-none">
                      <Markdown>{aiResponse}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badges Section */}
            {user.badges && user.badges.length > 0 && (
              <section className="mb-12 p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Your Badges
                </h2>
                <div className="flex flex-wrap gap-4">
                  {user.badges.map((badge: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      {badge}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: Trophy, label: "Total XP", value: progress.totalXP.toLocaleString(), color: "text-yellow-500", bg: "bg-yellow-500/10" },
                { icon: Flame, label: "Day Streak", value: `${user.streak || 0} Days`, color: "text-orange-500", bg: "bg-orange-500/10" },
                { icon: CheckCircle2, label: "Topics Mastered", value: progress.completedTopics.length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { icon: Code2, label: "Projects Submitted", value: user.projectCount || 0, color: "text-indigo-500", bg: "bg-indigo-500/10" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-8">
                <section className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Continue Quest</h2>
                    <button onClick={() => navigate('/dsa-tracker')} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Go to Map</button>
                  </div>
                  <div className="space-y-4">
                    {DSA_TOPICS.slice(0, 3).map((topic, i) => {
                      const isCompleted = progress.completedTopics.includes(topic.id);
                      return (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 dark:bg-zinc-700 text-slate-400")}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-zinc-50">{topic.title}</span>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">{topic.xp} XP</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const ProjectsPage = ({ user, isDark, toggleTheme, onLogout }: { user: any, isDark: boolean, toggleTheme: () => void, onLogout: () => void }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    techStack: '',
    link: '',
    github: ''
  });

  useEffect(() => {
    if (editingProject) {
      setNewProject({
        title: editingProject.title || '',
        description: editingProject.description || '',
        techStack: editingProject.techStack?.join(', ') || '',
        link: editingProject.link || '',
        github: editingProject.github || ''
      });
      setIsAddingProject(true);
    } else {
      setNewProject({ title: '', description: '', techStack: '', link: '', github: '' });
    }
  }, [editingProject]);

  useEffect(() => {
    if (user) {
      getProjects().then(setProjects).catch(() => toast.error("Failed to load projects"));
    }
  }, [user]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) {
      toast.error("Please fill in the title and description.");
      return;
    }

    try {
      const projectData = {
        ...newProject,
        techStack: newProject.techStack.split(',').map(s => s.trim()).filter(s => s)
      };

      if (editingProject) {
        await updateProject(editingProject._id, projectData);
        toast.success("Project updated successfully!");
      } else {
        await addProject(projectData);
        toast.success("Project added successfully!");
      }
      
      setIsAddingProject(false);
      setEditingProject(null);
      setNewProject({ title: '', description: '', techStack: '', link: '', github: '' });
      
      // Refresh projects
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (error) {
      toast.error(editingProject ? "Failed to update project." : "Failed to add project.");
    }
  };

  if (!user) return <Navigate to="/" />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="Projects"
        onLogout={onLogout}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          title="My Projects"
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-zinc-50 mb-2">Showcase Your Work</h1>
                <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base">Manage and showcase your technical projects to recruiters.</p>
              </div>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-5 h-5" />
                Add Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {projects.map((project, i) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: i * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98]
                    }}
                    onClick={() => setSelectedProject(project)}
                    className="group p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                        }}
                        className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 transition-all"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-600 dark:text-zinc-400">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-600">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-3 group-hover:text-indigo-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm line-clamp-3 mb-6">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack?.slice(0, 3).map((tech: string, j: number) => (
                        <span key={j} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                          {tech}
                        </span>
                      ))}
                      {project.techStack?.length > 3 && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {projects.length === 0 && !isAddingProject && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Code2 className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">No projects yet</h3>
                <p className="text-slate-500 dark:text-zinc-400 mb-8">Start by adding your first project to showcase your skills.</p>
                <button 
                  onClick={() => setIsAddingProject(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProject(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-y-auto border border-slate-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">{editingProject ? 'Edit Project' : 'New Project'}</h2>
                <button 
                  onClick={() => {
                    setIsAddingProject(false);
                    setEditingProject(null);
                  }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmitProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Project Title</label>
                  <input 
                    type="text"
                    required
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm"
                    placeholder="e.g. AI Portfolio Generator"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white resize-none text-sm"
                    placeholder="What does your project do?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Tech Stack (comma separated)</label>
                  <input 
                    type="text"
                    value={newProject.techStack}
                    onChange={(e) => setNewProject({...newProject, techStack: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm"
                    placeholder="e.g. React, Tailwind, Firebase"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Live Link</label>
                    <input 
                      type="url"
                      value={newProject.link}
                      onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">GitHub URL</label>
                    <input 
                      type="url"
                      value={newProject.github}
                      onChange={(e) => setNewProject({...newProject, github: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 mt-2"
                >
                  {editingProject ? 'Save Changes' : 'Submit Project'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-y-auto border border-slate-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">{selectedProject.title}</h2>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About Project</h4>
                  <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-base">
                    {selectedProject.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.techStack?.map((tech: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {selectedProject.link && (
                    <a 
                      href={selectedProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  )}
                  {selectedProject.github && (
                    <a 
                      href={selectedProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      <Github className="w-4 h-4" />
                      View Code
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RoadmapPage = ({ user, isDark, toggleTheme, onLogout }: any) => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const quoteText = "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill";

  useEffect(() => {
    if (quoteRef.current) {
      gsap.to(quoteRef.current, {
        duration: 4,
        text: quoteText,
        ease: "none",
        scrollTrigger: {
          trigger: quoteRef.current,
          start: "top 80%",
        }
      });
    }
  }, []);

  const roadmapSteps = [
    {
      title: "Phase 1: The Foundation",
      description: "Master one programming language (C++, Java, or Python) and understand basic data structures like Arrays, Strings, and Linked Lists.",
      icon: Code2,
      color: "bg-blue-500",
      tasks: ["Language Syntax & STL/Collections", "Time & Space Complexity", "Basic Recursion"]
    },
    {
      title: "Phase 2: DSA Mastery",
      description: "Deep dive into advanced topics like Trees, Graphs, Dynamic Programming, and Greedy algorithms. Aim for 300+ problems.",
      icon: Brain,
      color: "bg-indigo-500",
      tasks: ["LeetCode Top Interview 150", "Topic-wise Problem Solving", "Weekly Contests"]
    },
    {
      title: "Phase 3: Core CS Subjects",
      description: "Prepare for technical interviews by mastering Operating Systems, DBMS, Computer Networks, and Object-Oriented Programming.",
      icon: Cpu,
      color: "bg-purple-500",
      tasks: ["SQL Queries & Normalization", "OS Scheduling & Deadlocks", "Networking Protocols"]
    },
    {
      title: "Phase 4: Project Development",
      description: "Build 2-3 high-quality full-stack projects that solve real-world problems. Focus on clean code and documentation.",
      icon: Rocket,
      color: "bg-pink-500",
      tasks: ["MERN/Next.js Stack", "API Integration", "Deployment (Vercel/AWS)"]
    },
    {
      title: "Phase 5: Professional Presence",
      description: "Optimize your resume, LinkedIn profile, and GitHub repositories. Start networking with industry professionals.",
      icon: Target,
      color: "bg-orange-500",
      tasks: ["ATS-friendly Resume", "GitHub Portfolio", "LinkedIn Networking"]
    },
    {
      title: "Phase 6: Interview Preparation",
      description: "Practice mock interviews, focus on behavioral questions, and refine your problem-solving communication.",
      icon: Users,
      color: "bg-emerald-500",
      tasks: ["Mock Interviews (Pramp/Peer)", "STAR Method for Behavioral", "Company-specific Research"]
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="Roadmap"
        onLogout={onLogout}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          title="Success Roadmap"
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            {/* Motivational Quote Section */}
            <div className="mb-16 text-center">
              <div className="inline-block p-1 rounded-full bg-indigo-500/10 mb-6">
                <div className="px-4 py-1 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">
                  Daily Inspiration
                </div>
              </div>
              <p 
                ref={quoteRef}
                className="text-2xl sm:text-3xl font-display font-medium text-slate-800 dark:text-zinc-200 italic min-h-[4em]"
              ></p>
            </div>

            {/* Roadmap Path */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 dark:bg-zinc-800 rounded-full hidden sm:block" />

              <div className="space-y-12">
                {roadmapSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative flex flex-col sm:flex-row gap-8"
                  >
                    {/* Icon/Checkpoint */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-white",
                        step.color
                      )}>
                        <step.icon className="w-8 h-8" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50">{step.title}</h3>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Step {i + 1}</span>
                      </div>
                      <p className="text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {step.tasks.map((task, j) => (
                          <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{task}</span>
                          </div>
                        ))}
                      </div>
                      {step.title === "Phase 3: Core CS Subjects" && (
                        <button 
                          onClick={() => navigate('/core-subjects')}
                          className="mt-6 w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                          Explore Subjects <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-20 p-10 rounded-[40px] bg-indigo-600 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ 
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
                backgroundSize: '24px 24px' 
              }} />
              <h2 className="text-3xl font-display font-bold mb-4 relative z-10">Ready to Start Your Journey?</h2>
              <p className="text-indigo-100 mb-8 max-w-xl mx-auto relative z-10">
                Consistency is the key to success. Follow this roadmap diligently, and you'll be well-prepared for any technical challenge.
              </p>
              <button 
                onClick={() => navigate('/dsa-tracker')}
                className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-xl relative z-10"
              >
                Start DSA Quest
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const TopicPage = ({ user, isDark, toggleTheme, onLogout }: { user: any, isDark: boolean, toggleTheme: () => void, onLogout: () => void }) => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const topic = DSA_TOPICS.find(t => t.id === topicId);
  const questions = topicId ? TOPIC_QUESTIONS[topicId] : [];

  if (!topic) return <Navigate to="/dsa-tracker" />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        user={user} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        activeItem="DSA Tracker"
        onLogout={onLogout}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <DashboardHeader 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          user={user}
          title={topic.title}
        />

        <main className="py-12 px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <button 
              onClick={() => navigate('/dsa-tracker')}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-bold"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Map
            </button>

            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-zinc-50 mb-4">{topic.title} Mastery</h1>
              <p className="text-slate-500 dark:text-zinc-400 text-base sm:text-lg">Top 20 most commonly asked interview questions for {topic.title}.</p>
            </div>

            <div className="grid gap-4">
              {questions.map((q, i) => (
                <motion.a
                  key={q.id}
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-4 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          q.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-600" :
                          q.difficulty === 'Medium' ? "bg-orange-500/10 text-orange-600" :
                          "bg-red-500/10 text-red-600"
                        )}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-600 transition-colors sm:ml-auto">
                    <span className="text-xs sm:text-sm font-bold">Solve on LeetCode</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const googleId = localStorage.getItem("google_id");
      const authToken = localStorage.getItem("auth_token");
      if (googleId || authToken) {
        try {
          const profile = await getUserProfile();
          setUser(profile);
        } catch (error) {
          localStorage.removeItem("google_id");
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();

    // Poll for updates every 10 seconds to keep MongoDB data fresh
    const interval = setInterval(async () => {
      const googleId = localStorage.getItem("google_id");
      const authToken = localStorage.getItem("auth_token");
      if (googleId || authToken) {
        try {
          const profile = await getUserProfile();
          setUser(profile);
        } catch (error) {
          // Ignore polling errors
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    localStorage.removeItem("google_id");
    localStorage.removeItem("auth_token");
    setUser(null);
    toast.info("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen selection:bg-indigo-200 dark:selection:bg-indigo-500 selection:text-indigo-900 dark:selection:text-white transition-colors duration-300">
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={(u) => setUser(u)} />
        <InteractiveBackground isDark={isDark} />
        
        <Routes>
          <Route path="/" element={<LandingPage isDark={isDark} toggleTheme={toggleTheme} user={user} onLogin={() => setIsLoginModalOpen(true)} onLogout={handleLogout} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/settings" element={user ? <SettingsPage user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/core-subjects" element={user ? <CoreSubjectsPage user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/roadmap" element={user ? <RoadmapPage user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/projects" element={user ? <ProjectsPage user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/dsa-tracker" element={user ? <DSATracker user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/dsa-tracker/:topicId" element={user ? <TopicPage user={user} isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <ToastContainer 
          position="bottom-right"
          theme={isDark ? 'dark' : 'light'}
          toastClassName="rounded-2xl font-bold shadow-xl border border-slate-200 dark:border-zinc-800"
          aria-label="Notifications"
        />
      </div>
    </BrowserRouter>
  );
}
