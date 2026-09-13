import React, { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, User, ArrowRight, Building2, Briefcase } from "lucide-react";

/**
 * POLARIS Auth Gate & Authentication Modal
 * - Engineered to fit comfortably within 100% zoom on all viewports without scrolling
 * - Clean ergonomic inputs with zero clipping or overflow
 */
export default function PolarisAuthGateModal({ isOpen, onClose, onSuccess, initialPrompt }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("student"); // "student" | "researcher"
  const [institution, setInstitution] = useState("");
  const [designation, setDesignation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || (typeof window !== 'undefined' && window.VITE_API_BASE_URL) || '';
      if (mode === "login") {
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const rawText = await res.text();
        let data = null;
        try {
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          if (rawText.trim().startsWith("<") || res.status === 405 || res.status === 404) {
            throw new Error("Vercel Configuration Notice: Please set Environment Variable VITE_API_BASE_URL = https://your-backend.onrender.com in Vercel settings and redeploy.");
          }
          throw new Error("Backend server is offline or unreachable. Please ensure Backend API server (Port 5000) is running.");
        }
        if (!res.ok || !data || !data.success) {
          throw new Error((data && data.message) || "Invalid credentials. Please verify your email and password.");
        }
        if (typeof onSuccess === "function") {
          onSuccess(data.data.user, data.data.token);
        }
      } else {
        if (!name.trim()) throw new Error("Full name is required.");
        if (role === "researcher" && !institution.trim()) {
          throw new Error("Institution name is required for polar researcher credentials.");
        }
        const res = await fetch(`${apiBase}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: name.trim(),
            role,
            institution: institution.trim(),
            designation: designation.trim()
          })
        });
        const rawText = await res.text();
        let data = null;
        try {
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          if (rawText.trim().startsWith("<") || res.status === 405 || res.status === 404) {
            throw new Error("Vercel Configuration Notice: Please set Environment Variable VITE_API_BASE_URL = https://your-backend.onrender.com in Vercel settings and redeploy.");
          }
          throw new Error("Backend server is offline or unreachable. Please ensure Backend API server (Port 5000) is running.");
        }
        if (!res.ok || !data || !data.success) {
          throw new Error((data && data.message) || "Registration could not be completed.");
        }
        if (typeof onSuccess === "function") {
          onSuccess(data.data.user, data.data.token);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (demoRole) => {
    setErrorMsg("");
    if (demoRole === "student") {
      setEmail("student_demo@polar.test");
      setPassword("Password@123");
    } else if (demoRole === "researcher") {
      setEmail("researcher_demo@polar.test");
      setPassword("Password@123");
    } else if (demoRole === "admin") {
      setEmail("admin@gmail.com");
      setPassword("Hello@2006");
    }
    setMode("login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-slate-900 border border-slate-700/80 rounded-2xl px-6 sm:px-8 py-5 sm:py-6 shadow-2xl shadow-cyan-950/50 relative my-auto overflow-y-auto max-h-[94vh]"
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Polar Cyan Ambient Accent Line */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

        {/* Clean Close Button strictly in top-right corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 z-20 cursor-pointer transition-colors"
          style={{ top: "1rem", right: "1rem", zIndex: 20 }}
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tag & Titles */}
        <div className="pr-8 mb-3.5">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-[10px] font-bold tracking-widest text-cyan-400 uppercase mb-1.5">
            POLAR DATA ACCESS GATE
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {mode === "login" ? "Sign In to Polaris Hub" : "Create Polaris Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {initialPrompt ||
              (mode === "login"
                ? "Sign in to access verified datasets & research tools"
                : "Register to access polar telemetry, publish datasets, and contribute models.")}
          </p>
        </div>

        {/* Segmented Tab Switch */}
        <div className="flex p-1 bg-slate-950/90 border border-slate-800 rounded-xl mb-3.5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
              mode === "login"
                ? "bg-cyan-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200 font-medium"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
              mode === "register"
                ? "bg-cyan-600 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200 font-medium"
            }`}
          >
            Register New User
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "login" ? (
            <>
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="researcher@polaris.gov.in"
                    className="w-full h-[46px] pl-10.5 pr-4 bg-slate-950/80 border border-slate-700/80 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all font-sans text-sm text-slate-100 placeholder:text-slate-500"
                    style={{ height: "46px", paddingLeft: "2.75rem" }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    Password <span className="text-cyan-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        "For demo access, click one of the quick demo credentials chips below (Student, Researcher, or Admin)."
                      );
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[46px] pl-10.5 pr-10 bg-slate-950/80 border border-slate-700/80 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all font-sans text-sm text-slate-100 placeholder:text-slate-500"
                    style={{ height: "46px", paddingLeft: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* In Register Mode: Name & Email side-by-side to save height */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Full Name <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Ramesh Chandra"
                      className="w-full h-[44px] pl-10 pr-3 bg-slate-950/80 border border-slate-700/80 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all font-sans text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                      style={{ height: "44px", paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Email Address <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@polaris.gov.in"
                      className="w-full h-[44px] pl-10 pr-3 bg-slate-950/80 border border-slate-700/80 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all font-sans text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                      style={{ height: "44px", paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>
              </div>

              {/* Password in Register Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Create Password <span className="text-cyan-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[44px] pl-10 pr-10 bg-slate-950/80 border border-slate-700/80 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none transition-all font-sans text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                    style={{ height: "44px", paddingLeft: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Compact Role Selection */}
              <div className="space-y-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                  Account Role Selection
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`p-2 rounded-lg border flex items-center gap-2 transition cursor-pointer ${
                      role === "student"
                        ? "ring-1 ring-cyan-400/50 bg-cyan-950/80 text-white border-cyan-500/50"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span className="text-lg">🎓</span>
                    <div className="text-left">
                      <div className="font-bold text-xs text-white">Student</div>
                      <div className="text-[10px] text-slate-400">Verified Data Access</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("researcher")}
                    className={`p-2 rounded-lg border flex items-center gap-2 transition cursor-pointer ${
                      role === "researcher"
                        ? "ring-1 ring-cyan-400/50 bg-cyan-950/80 text-white border-cyan-500/50"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span className="text-lg">🔬</span>
                    <div className="text-left">
                      <div className="font-bold text-xs text-white">Researcher</div>
                      <div className="text-[10px] text-slate-400">Publish & Upload</div>
                    </div>
                  </button>
                </div>

                {role === "researcher" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 animate-fade-in">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1 text-[11px]">
                        Institution *
                      </label>
                      <div className="relative flex items-center">
                        <Building2 className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. NCPOR Goa"
                          className="w-full h-9 pl-8 pr-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                          style={{ height: "36px", paddingLeft: "2rem" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1 text-[11px]">
                        Designation / Lab
                      </label>
                      <div className="relative flex items-center">
                        <Briefcase className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Senior Scientist"
                          className="w-full h-9 pl-8 pr-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                          style={{ height: "36px", paddingLeft: "2rem" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            style={{ height: "44px" }}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>
              {loading
                ? "Authenticating..."
                : mode === "login"
                ? "Sign In to Polaris Hub"
                : "Complete Registration"}
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Demo Credentials Section (Footer Layout) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Quick Demo Testing Credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn("student")}
              className="py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 text-xs font-semibold text-purple-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>🎓</span>
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn("researcher")}
              className="py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>🔬</span>
              <span>Researcher</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn("admin")}
              className="py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>⚡</span>
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
