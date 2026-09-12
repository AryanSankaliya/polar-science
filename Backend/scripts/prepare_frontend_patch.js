const fs = require('fs');
const path = require('path');

const assetFile = path.join(__dirname, '../../Frontend/moes-polar-portal/assets/index-v2.js');
const distFile = path.join(__dirname, '../../Frontend/moes-polar-portal/dist/assets/index-v2.js');

console.log('Reading:', assetFile);
let content = fs.readFileSync(assetFile, 'utf8');

// 1. Check if backup exists, if not create one
const backupPath = assetFile + '.bak';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, content);
  console.log('Created backup at:', backupPath);
}

// ============================================================================
// COMPONENTS DEFINITION: AuthModal, UploadModal, AdminReviewConsole, Toast
// ============================================================================
const RBAC_COMPONENTS = `
/* ============================================================================
 * POLARIS RBAC AUTH & DATASET GOVERNANCE MODULE
 * Roles: student (default), researcher, admin
 * ============================================================================ */

function PolarisToast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return u.jsxs("div", {
    className: "fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#061426]/95 border shadow-2xl backdrop-blur-xl animate-fade-in " + 
      (isError ? "border-rose-500/50 text-rose-200 shadow-rose-950/50" : "border-cyan-500/40 text-cyan-200 shadow-cyan-950/50"),
    children: [
      u.jsx("span", { className: "text-lg", children: isError ? "⚠️" : "❄️" }),
      u.jsxs("div", {
        children: [
          u.jsx("div", { className: "text-xs font-bold text-white", children: isError ? "Polar Notice" : "Polar Science System" }),
          u.jsx("div", { className: "text-xs text-slate-300 font-mono mt-0.5", children: toast.msg })
        ]
      }),
      u.jsx("button", {
        onClick: onClose,
        className: "p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-2",
        children: u.jsx(Ws, { className: "w-4 h-4" })
      })
    ]
  });
}

function PolarisAuthGateModal({ isOpen, onClose, onSuccess, initialPrompt }) {
  const [mode, setMode] = V.useState("login"); // "login" | "register"
  const [email, setEmail] = V.useState("");
  const [password, setPassword] = V.useState("");
  const [name, setName] = V.useState("");
  const [role, setRole] = V.useState("student"); // "student" | "researcher"
  const [institution, setInstitution] = V.useState("");
  const [designation, setDesignation] = V.useState("");
  const [loading, setLoading] = V.useState(false);
  const [errorMsg, setErrorMsg] = V.useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Invalid credentials. Please verify your email and password.");
        }
        onSuccess(data.data.user, data.data.token);
      } else {
        if (!name.trim()) throw new Error("Full name is required.");
        if (role === "researcher" && !institution.trim()) {
          throw new Error("Institution name is required for polar researcher credentials.");
        }
        const res = await fetch("/api/auth/register", {
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
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Registration could not be completed.");
        }
        onSuccess(data.data.user, data.data.token);
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

  return u.jsx("div", {
    className: "fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in",
    children: u.jsxs("div", {
      className: "relative bg-[#061426] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-cyan-950/80 glass-panel",
      children: [
        /* Top Banner & Close */
        u.jsxs("div", {
          className: "flex items-start justify-between border-b border-cyan-500/20 pb-4",
          children: [
            u.jsxs("div", {
              className: "space-y-1",
              children: [
                u.jsxs("div", {
                  className: "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30",
                  children: [
                    u.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" }),
                    "POLAR DATA ACCESS GATE"
                  ]
                }),
                u.jsx("h3", {
                  className: "text-lg sm:text-xl font-black text-white tracking-tight",
                  children: mode === "login" ? "Sign In to Polaris Hub" : "Create Polaris Research Account"
                }),
                initialPrompt && u.jsx("p", {
                  className: "text-xs text-amber-300/90 font-medium",
                  children: initialPrompt
                })
              ]
            }),
            u.jsx("button", {
              onClick: onClose,
              className: "p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition",
              children: u.jsx(Ws, { className: "w-5 h-5" })
            })
          ]
        }),

        /* Mode Toggle Tabs */
        u.jsxs("div", {
          className: "grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800",
          children: [
            u.jsx("button", {
              type: "button",
              onClick: () => { setMode("login"); setErrorMsg(""); },
              className: "py-2 rounded-lg text-xs font-bold transition " + (mode === "login" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"),
              children: "Sign In"
            }),
            u.jsx("button", {
              type: "button",
              onClick: () => { setMode("register"); setErrorMsg(""); },
              className: "py-2 rounded-lg text-xs font-bold transition " + (mode === "register" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"),
              children: "Register New User"
            })
          ]
        }),

        /* Error Alert Box */
        errorMsg && u.jsxs("div", {
          className: "p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2",
          children: [
            u.jsx("span", { children: "⚠️" }),
            u.jsx("span", { children: errorMsg })
          ]
        }),

        /* Form */
        u.jsxs("form", {
          onSubmit: handleSubmit,
          className: "space-y-4 text-xs",
          children: [
            mode === "register" && u.jsxs("div", {
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Full Name *" }),
                u.jsx("input", {
                  type: "text",
                  required: true,
                  value: name,
                  onChange: e => setName(e.target.value),
                  placeholder: "e.g. Dr. Ramesh Chandra / Aryan Roy",
                  className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                })
              ]
            }),

            u.jsxs("div", {
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Email Address *" }),
                u.jsx("input", {
                  type: "email",
                  required: true,
                  value: email,
                  onChange: e => setEmail(e.target.value),
                  placeholder: "e.g. researcher@ncpor.res.in",
                  className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                })
              ]
            }),

            u.jsxs("div", {
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Password *" }),
                u.jsx("input", {
                  type: "password",
                  required: true,
                  value: password,
                  onChange: e => setPassword(e.target.value),
                  placeholder: "••••••••",
                  className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                })
              ]
            }),

            mode === "register" && u.jsxs("div", {
              className: "space-y-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800",
              children: [
                u.jsx("div", { className: "text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono", children: "Account Role Selection" }),
                u.jsxs("div", {
                  className: "grid grid-cols-2 gap-2",
                  children: [
                    u.jsxs("button", {
                      type: "button",
                      onClick: () => setRole("student"),
                      className: "p-2.5 rounded-xl border text-left transition flex items-center gap-2 " + (role === "student" ? "bg-emerald-950/80 border-emerald-400 text-white" : "bg-slate-900/60 border-slate-800 text-slate-400"),
                      children: [
                        u.jsx("span", { className: "text-base", children: "🎓" }),
                        u.jsxs("div", {
                          children: [
                            u.jsx("div", { className: "font-bold text-xs text-white", children: "Student" }),
                            u.jsx("div", { className: "text-[10px] text-slate-400", children: "Download Verified Data" })
                          ]
                        })
                      ]
                    }),
                    u.jsxs("button", {
                      type: "button",
                      onClick: () => setRole("researcher"),
                      className: "p-2.5 rounded-xl border text-left transition flex items-center gap-2 " + (role === "researcher" ? "bg-cyan-950/80 border-cyan-400 text-white" : "bg-slate-900/60 border-slate-800 text-slate-400"),
                      children: [
                        u.jsx("span", { className: "text-base", children: "🔬" }),
                        u.jsxs("div", {
                          children: [
                            u.jsx("div", { className: "font-bold text-xs text-white", children: "Researcher" }),
                            u.jsx("div", { className: "text-[10px] text-slate-400", children: "Submit & Upload Datasets" })
                          ]
                        })
                      ]
                    })
                  ]
                }),

                role === "researcher" && u.jsxs("div", {
                  className: "space-y-2 pt-2 border-t border-slate-800/80 animate-fade-in",
                  children: [
                    u.jsxs("div", {
                      children: [
                        u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Research Institution / University *" }),
                        u.jsx("input", {
                          type: "text",
                          required: true,
                          value: institution,
                          onChange: e => setInstitution(e.target.value),
                          placeholder: "e.g. NCPOR Goa / IMD / IIT Roorkee",
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        })
                      ]
                    }),
                    u.jsxs("div", {
                      children: [
                        u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Designation / Laboratory" }),
                        u.jsx("input", {
                          type: "text",
                          value: designation,
                          onChange: e => setDesignation(e.target.value),
                          placeholder: "e.g. Senior Cryosphere Scientist / Postdoc",
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        })
                      ]
                    })
                  ]
                })
              ]
            }),

            /* Submit Button */
            u.jsxs("button", {
              type: "submit",
              disabled: loading,
              className: "w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-2",
              children: [
                loading && u.jsx("span", { className: "w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" }),
                u.jsx("span", {
                  children: loading ? "Verifying..." : (mode === "login" ? "Sign In & Continue" : "Complete Registration & Continue")
                })
              ]
            })
          ]
        }),

        /* 1-Click Demo Accounts Switcher */
        u.jsxs("div", {
          className: "pt-3 border-t border-slate-800/80 text-center space-y-2",
          children: [
            u.jsx("div", { className: "text-[11px] text-slate-400 font-mono", children: "Quick Demo Testing Credentials:" }),
            u.jsxs("div", {
              className: "flex flex-wrap items-center justify-center gap-2",
              children: [
                u.jsx("button", {
                  type: "button",
                  onClick: () => handleDemoSignIn("student"),
                  className: "px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono transition",
                  children: "🎓 Student Demo"
                }),
                u.jsx("button", {
                  type: "button",
                  onClick: () => handleDemoSignIn("researcher"),
                  className: "px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono transition",
                  children: "🔬 Researcher Demo"
                }),
                u.jsx("button", {
                  type: "button",
                  onClick: () => handleDemoSignIn("admin"),
                  className: "px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-mono transition",
                  children: "⚡ Admin Demo"
                })
              ]
            })
          ]
        })
      ]
    })
  });
}

function PolarisDatasetUploadModal({ isOpen, onClose, onSuccess, currentUser, authToken }) {
  const [title, setTitle] = V.useState("");
  const [category, setCategory] = V.useState("02_scientific");
  const [fileFormat, setFileFormat] = V.useState("CSV");
  const [fileUrl, setFileUrl] = V.useState("");
  const [abstract, setAbstract] = V.useState("");
  const [institution, setInstitution] = V.useState(currentUser?.institution || "");
  const [loading, setLoading] = V.useState(false);
  const [errorMsg, setErrorMsg] = V.useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Dataset title is required.");
      if (!fileUrl.trim()) throw new Error("Dataset download link / URL is required.");

      const res = await fetch("/api/submissions/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authToken
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          discipline: category,
          file_format: fileFormat,
          file_url: fileUrl.trim(),
          description: abstract.trim(),
          abstract: abstract.trim(),
          institution: institution.trim() || currentUser?.institution || "Verified Researcher"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit dataset for verification.");
      }

      onSuccess(data.data);
    } catch (err) {
      setErrorMsg(err.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return u.jsx("div", {
    className: "fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in",
    children: u.jsxs("div", {
      className: "relative bg-[#061426] border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl shadow-cyan-950/80 glass-panel",
      children: [
        /* Header */
        u.jsxs("div", {
          className: "flex items-start justify-between border-b border-cyan-500/20 pb-4",
          children: [
            u.jsxs("div", {
              className: "space-y-1",
              children: [
                u.jsxs("div", {
                  className: "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
                  children: [
                    u.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }),
                    "RESEARCHER GOVERNANCE PIPELINE"
                  ]
                }),
                u.jsx("h3", {
                  className: "text-xl font-black text-white tracking-tight",
                  children: "Submit Scientific Polar Dataset"
                }),
                u.jsx("p", {
                  className: "text-xs text-slate-400",
                  children: "Submissions enter 'pending' state and are reviewed by NCPOR Polar Review Board before publishing to live catalogue."
                })
              ]
            }),
            u.jsx("button", {
              onClick: onClose,
              className: "p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition",
              children: u.jsx(Ws, { className: "w-5 h-5" })
            })
          ]
        }),

        errorMsg && u.jsxs("div", {
          className: "p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2",
          children: [
            u.jsx("span", { children: "⚠️" }),
            u.jsx("span", { children: errorMsg })
          ]
        }),

        /* Form */
        u.jsxs("form", {
          onSubmit: handleSubmit,
          className: "space-y-4 text-xs",
          children: [
            u.jsxs("div", {
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Dataset Title *" }),
                u.jsx("input", {
                  type: "text",
                  required: true,
                  value: title,
                  onChange: e => setTitle(e.target.value),
                  placeholder: "e.g. Larsemann Hills Coastal CTD Salinity & Basal Melt Profiles",
                  className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                })
              ]
            }),

            u.jsxs("div", {
              className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
              children: [
                u.jsxs("div", {
                  children: [
                    u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Polar Tier / Category *" }),
                    u.jsxs("select", {
                      value: category,
                      onChange: e => setCategory(e.target.value),
                      className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400",
                      children: [
                        u.jsx("option", { value: "01_Weather", children: "01_Weather (Meteorological & AWS Surface Data)" }),
                        u.jsx("option", { value: "02_scientific", children: "02_scientific (National Polar Scientific Data)" }),
                        u.jsx("option", { value: "03_Research", children: "03_Research (Research Papers & Projects)" }),
                        u.jsx("option", { value: "04_expeditions", children: "04_expeditions (Technical & Cruise Reports)" }),
                        u.jsx("option", { value: "05_Outreach", children: "05_Outreach (Media & Soundscapes)" }),
                        u.jsx("option", { value: "06_Satellite Geospatial", children: "06_Satellite Geospatial (Imagery & Rasters)" })
                      ]
                    })
                  ]
                }),
                u.jsxs("div", {
                  children: [
                    u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "File Format *" }),
                    u.jsxs("select", {
                      value: fileFormat,
                      onChange: e => setFileFormat(e.target.value),
                      className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400",
                      children: [
                        u.jsx("option", { value: "CSV", children: "CSV (Comma Separated Values)" }),
                        u.jsx("option", { value: "ZIP", children: "ZIP (Multi-file Bundle Archive)" }),
                        u.jsx("option", { value: "NetCDF", children: "NetCDF-4 (.nc scientific grid)" }),
                        u.jsx("option", { value: "GeoTIFF", children: "GeoTIFF (Calibrated Raster)" }),
                        u.jsx("option", { value: "PDF", children: "PDF Technical Report" }),
                        u.jsx("option", { value: "GeoJSON", children: "GeoJSON / Vector Layer" })
                      ]
                    })
                  ]
                })
              ]
            }),

            u.jsxs("div", {
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "File Download URL / Hugging Face Resolve Link *" }),
                u.jsx("input", {
                  type: "url",
                  required: true,
                  value: fileUrl,
                  onChange: e => setFileUrl(e.target.value),
                  placeholder: "https://huggingface.co/datasets/.../resolve/main/.../bundle.zip",
                  className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                })
              ]
            }),

            u.jsxs("div", {
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block mb-1", children: "Research Abstract & Methodology *" }),
                u.jsx("textarea", {
                  rows: 4,
                  required: true,
                  value: abstract,
                  onChange: e => setAbstract(e.target.value),
                  placeholder: "Provide scientific summary, sampling depth, instrument sensors (e.g. Seabird SBE 911plus), coordinate bounds, and temporal coverage...",
                  className: "w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                })
              ]
            }),

            u.jsxs("div", {
              className: "flex items-center justify-end gap-3 pt-3 border-t border-slate-800",
              children: [
                u.jsx("button", {
                  type: "button",
                  onClick: onClose,
                  className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition",
                  children: "Cancel"
                }),
                u.jsxs("button", {
                  type: "submit",
                  disabled: loading,
                  className: "px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer",
                  children: [
                    loading && u.jsx("span", { className: "w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" }),
                    u.jsx("span", { children: loading ? "Submitting..." : "Submit for Admin Verification" })
                  ]
                })
              ]
            })
          ]
        })
      ]
    })
  });
}

function PolarisAdminReviewConsole({ currentUser, authToken, onShowToast, onNavigateToDatasets }) {
  const [submissions, setSubmissions] = V.useState([]);
  const [loading, setLoading] = V.useState(!0);
  const [statusFilter, setStatusFilter] = V.useState("pending");
  const [decisionLoadingId, setDecisionLoadingId] = V.useState(null);
  const [rejectingItem, setRejectingItem] = V.useState(null);
  const [rejectRemarks, setRejectRemarks] = V.useState("");

  const fetchSubmissions = V.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions?status=" + statusFilter, {
        headers: {
          "Authorization": "Bearer " + (authToken || localStorage.getItem("polaris_token") || "")
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data?.submissions)) {
        setSubmissions(data.data.submissions);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, authToken]);

  V.useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleDecision = async (id, decision, remarks = "") => {
    setDecisionLoadingId(id);
    try {
      const res = await fetch("/api/admin/submissions/" + id + "/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (authToken || localStorage.getItem("polaris_token") || "")
        },
        body: JSON.stringify({ decision, remarks })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to execute decision.");
      }

      if (decision === "approve") {
        if (typeof cu === "function") {
          cu({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
        onShowToast && onShowToast("✅ Approved & automatically published dataset to live catalog!");
      } else {
        onShowToast && onShowToast("Dataset submission rejected.");
      }

      setRejectingItem(null);
      setRejectRemarks("");
      fetchSubmissions();
    } catch (err) {
      onShowToast && onShowToast(err.message || "Error processing decision", "error");
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const pendingCount = submissions.filter(s => s.status === "pending").length;

  return u.jsxs("div", {
    className: "space-y-8 animate-fadeIn pb-24 max-w-7xl mx-auto px-2 sm:px-4",
    children: [
      /* Top Administrative Banner */
      u.jsxs("div", {
        className: "relative overflow-hidden rounded-3xl bg-[#061426]/95 border border-cyan-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl",
        children: [
          u.jsx("div", { className: "absolute -right-24 -top-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" }),
          u.jsxs("div", {
            className: "relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6",
            children: [
              u.jsxs("div", {
                className: "space-y-2 max-w-3xl",
                children: [
                  u.jsxs("div", {
                    className: "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-400/30",
                    children: [
                      u.jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-ping" }),
                      "NCPOR NATIONAL CRYOSPHERE GOVERNANCE"
                    ]
                  }),
                  u.jsx("h1", {
                    className: "text-2xl sm:text-3xl font-black text-white tracking-tight font-display",
                    children: "Admin Dataset Review & Verification Console"
                  }),
                  u.jsx("p", {
                    className: "text-slate-300 text-xs sm:text-sm leading-relaxed",
                    children: "Inspect, verify, and validate polar dataset submissions from accredited national researchers. Approved submissions are automatically minted and published to the live polar science dataset catalog."
                  })
                ]
              }),
              u.jsxs("div", {
                className: "flex items-center gap-3 shrink-0",
                children: [
                  u.jsxs("button", {
                    onClick: fetchSubmissions,
                    className: "px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-2 transition",
                    children: [
                      u.jsx(U1, { className: "w-4 h-4" }),
                      u.jsx("span", { children: "Refresh Submissions" })
                    ]
                  }),
                  u.jsxs("button", {
                    onClick: onNavigateToDatasets,
                    className: "px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition",
                    children: [
                      u.jsx(fr, { className: "w-4 h-4" }),
                      u.jsx("span", { children: "View Live Catalogue" })
                    ]
                  })
                ]
              })
            ]
          }),

          /* Filter Status Pills */
          u.jsxs("div", {
            className: "flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800/80",
            children: [
              u.jsxs("button", {
                onClick: () => setStatusFilter("pending"),
                className: "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 " + 
                  (statusFilter === "pending" ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20" : "bg-slate-900 text-slate-300 hover:text-white"),
                children: [
                  u.jsx("span", { children: "⏳ Pending Submissions" }),
                  statusFilter === "pending" && u.jsx("span", { className: "px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 font-mono text-[10px]", children: submissions.length })
                ]
              }),
              u.jsxs("button", {
                onClick: () => setStatusFilter("approved"),
                className: "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 " + 
                  (statusFilter === "approved" ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" : "bg-slate-900 text-slate-300 hover:text-white"),
                children: [
                  u.jsx("span", { children: "✅ Approved & Published" }),
                  statusFilter === "approved" && u.jsx("span", { className: "px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-300 font-mono text-[10px]", children: submissions.length })
                ]
              }),
              u.jsxs("button", {
                onClick: () => setStatusFilter("rejected"),
                className: "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 " + 
                  (statusFilter === "rejected" ? "bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/20" : "bg-slate-900 text-slate-300 hover:text-white"),
                children: [
                  u.jsx("span", { children: "❌ Rejected" })
                ]
              }),
              u.jsx("button", {
                onClick: () => setStatusFilter("all"),
                className: "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition " + 
                  (statusFilter === "all" ? "bg-cyan-500 text-slate-950 font-bold shadow-md" : "bg-slate-900 text-slate-300 hover:text-white"),
                children: "All Records"
              })
            ]
          })
        ]
      }),

      /* Submissions Table / Cards */
      loading ? u.jsxs("div", {
        className: "py-20 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3",
        children: [
          u.jsx("div", { className: "w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" }),
          u.jsx("div", { className: "text-xs font-mono", children: "Fetching dataset submissions..." })
        ]
      }) : submissions.length === 0 ? u.jsxs("div", {
        className: "py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3",
        children: [
          u.jsx("span", { className: "text-4xl", children: "🛡️" }),
          u.jsx("h4", { className: "text-base font-bold text-white", children: "No " + statusFilter + " submissions found" }),
          u.jsx("p", { className: "text-xs text-slate-400 max-w-md", children: "All researcher dataset uploads have been processed or none have been submitted under this filter." })
        ]
      }) : u.jsx("div", {
        className: "space-y-4",
        children: submissions.map(sub => {
          const subId = sub.id || sub._id || sub.submission_id;
          const isPending = sub.status === "pending";
          const isApproved = sub.status === "approved";
          const isRejected = sub.status === "rejected";
          const isProcessing = decisionLoadingId === subId;

          return u.jsxs("div", {
            key: subId,
            className: "p-6 rounded-3xl bg-[#061426]/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 shadow-xl space-y-4",
            children: [
              /* Card Row 1: Submitter Info & Status */
              u.jsxs("div", {
                className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80",
                children: [
                  u.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      u.jsx("div", {
                        className: "w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-sm",
                        children: (sub.researcher_name || "R").charAt(0).toUpperCase()
                      }),
                      u.jsxs("div", {
                        children: [
                          u.jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [
                              u.jsx("span", { className: "text-sm font-bold text-white", children: sub.researcher_name || "Verified Researcher" }),
                              sub.institution && u.jsx("span", {
                                className: "px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300",
                                children: sub.institution
                              })
                            ]
                          }),
                          u.jsxs("div", {
                            className: "text-[11px] text-slate-400 font-mono mt-0.5",
                            children: [sub.researcher_email, " • Submitted ", new Date(sub.created_at).toLocaleDateString()]
                          })
                        ]
                      })
                    ]
                  }),
                  u.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      u.jsx("span", {
                        className: "px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider " + 
                          (isPending ? "bg-amber-500/10 text-amber-300 border border-amber-400/40" :
                           isApproved ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/40" :
                           "bg-rose-500/10 text-rose-300 border border-rose-400/40"),
                        children: isPending ? "⏳ Pending Review" : isApproved ? "✅ Approved & Published" : "❌ Rejected"
                      })
                    ]
                  })
                ]
              }),

              /* Card Row 2: Dataset Title, Category, Abstract */
              u.jsxs("div", {
                className: "space-y-2",
                children: [
                  u.jsxs("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      u.jsx("span", {
                        className: "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800",
                        children: sub.category
                      }),
                      u.jsx("span", {
                        className: "px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800",
                        children: "Format: " + (sub.file_format || "CSV")
                      }),
                      sub.temporal_coverage && u.jsx("span", {
                        className: "text-[10px] text-slate-400 font-mono",
                        children: "Coverage: " + sub.temporal_coverage
                      })
                    ]
                  }),
                  u.jsx("h3", {
                    className: "text-lg font-bold text-white tracking-tight leading-snug",
                    children: sub.title
                  }),
                  sub.description && u.jsx("p", {
                    className: "text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80",
                    children: sub.description
                  })
                ]
              }),

              /* Card Row 3: File Link Preview & Admin Actions */
              u.jsxs("div", {
                className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs",
                children: [
                  /* File Link Preview */
                  sub.file_url ? u.jsxs("a", {
                    href: sub.file_url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700 font-mono transition",
                    children: [
                      u.jsx(fr, { className: "w-3.5 h-3.5" }),
                      u.jsx("span", { className: "truncate max-w-xs", children: "Inspect Raw File Payload" })
                    ]
                  }) : u.jsx("span", { className: "text-slate-500 font-mono text-[11px]", children: "No direct URL specified" }),

                  /* Action Buttons */
                  isPending ? u.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      u.jsxs("button", {
                        type: "button",
                        disabled: isProcessing,
                        onClick: () => { setRejectingItem(sub); setRejectRemarks(""); },
                        className: "px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1.5",
                        children: [
                          u.jsx("span", { children: "❌" }),
                          u.jsx("span", { children: "Reject" })
                        ]
                      }),
                      u.jsxs("button", {
                        type: "button",
                        disabled: isProcessing,
                        onClick: () => handleDecision(subId, "approve"),
                        className: "px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center gap-1.5",
                        children: [
                          isProcessing ? u.jsx("span", { className: "w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" }) : u.jsx("span", { children: "✅" }),
                          u.jsx("span", { children: "Approve & Publish" })
                        ]
                      })
                    ]
                  }) : u.jsxs("div", {
                    className: "text-slate-400 font-mono text-[11px]",
                    children: [
                      sub.reviewed_at && u.jsx("span", { children: "Reviewed " + new Date(sub.reviewed_at).toLocaleDateString() }),
                      sub.admin_remarks && u.jsx("span", { className: "ml-2 text-slate-300 italic", children: '("' + sub.admin_remarks + '")' })
                    ]
                  })
                ]
              })
            ]
          });
        })
      }),

      /* Rejection Remarks Modal */
      rejectingItem && u.jsx("div", {
        className: "fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in",
        children: u.jsxs("div", {
          className: "relative bg-[#061426] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl glass-panel",
          children: [
            u.jsxs("div", {
              className: "flex items-start justify-between border-b border-slate-800 pb-3",
              children: [
                u.jsxs("div", {
                  children: [
                    u.jsx("h3", { className: "text-base font-bold text-white", children: "Reject Dataset Submission" }),
                    u.jsx("p", { className: "text-xs text-slate-400", children: rejectingItem.title })
                  ]
                }),
                u.jsx("button", {
                  onClick: () => setRejectingItem(null),
                  className: "p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white",
                  children: u.jsx(Ws, { className: "w-4 h-4" })
                })
              ]
            }),
            u.jsxs("div", {
              className: "space-y-2 text-xs",
              children: [
                u.jsx("label", { className: "text-slate-300 font-semibold block", children: "Rejection Reason / Scientific Remarks:" }),
                u.jsx("textarea", {
                  rows: 3,
                  value: rejectRemarks,
                  onChange: e => setRejectRemarks(e.target.value),
                  placeholder: "e.g. Incomplete coordinate bounding box or missing calibration sensor specs...",
                  className: "w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                })
              ]
            }),
            u.jsxs("div", {
              className: "flex items-center justify-end gap-2 pt-2",
              children: [
                u.jsx("button", {
                  onClick: () => setRejectingItem(null),
                  className: "px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700",
                  children: "Cancel"
                }),
                u.jsx("button", {
                  onClick: () => handleDecision(rejectingItem.id || rejectingItem._id || rejectingItem.submission_id, "reject", rejectRemarks),
                  className: "px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30",
                  children: "Confirm Rejection"
                })
              ]
            })
          ]
        })
      })
    ]
  });
}
`;

console.log('RBAC components prepared successfully!');
module.exports = { RBAC_COMPONENTS };
