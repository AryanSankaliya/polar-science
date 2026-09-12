const fs = require('fs');
const path = require('path');

const assetFile = path.resolve(__dirname, '../../Frontend/moes-polar-portal/assets/index-v2.js');
const distFile = path.resolve(__dirname, '../../Frontend/moes-polar-portal/dist/assets/index-v2.js');
const backupFile = assetFile + '.bak';

console.log('Restoring from backup before re-patching cleanly...');
let content = fs.readFileSync(backupFile, 'utf8');

// Load RBAC components
const { RBAC_COMPONENTS } = require('./prepare_frontend_patch.js');

// Normalize line endings to \n temporarily or handle \r\n
const isCRLF = content.includes('\r\n');
console.log('File is CRLF:', isCRLF);

// Helper function to safely replace regardless of CRLF or LF
function safeReplace(str, searchSnippet, replaceSnippet) {
  // Normalize both to LF for search
  const normalizedSearch = searchSnippet.replace(/\r\n/g, '\n');
  const normalizedStr = str.replace(/\r\n/g, '\n');
  const normalizedReplace = replaceSnippet.replace(/\r\n/g, '\n');

  const idx = normalizedStr.indexOf(normalizedSearch);
  if (idx === -1) {
    console.error('FAILED to find snippet starting with:', normalizedSearch.substring(0, 60));
    return str;
  }
  console.log('✓ Replaced snippet at offset:', idx);
  const result = normalizedStr.slice(0, idx) + normalizedReplace + normalizedStr.slice(idx + normalizedSearch.length);
  return isCRLF ? result.replace(/\n/g, '\r\n') : result;
}

// 1. Injected RBAC components right before function KC()
const kcAnchor = 'function KC(){';
const kcIndex = content.indexOf(kcAnchor);
if (kcIndex === -1) throw new Error('KC not found');
content = content.slice(0, kcIndex) + (isCRLF ? '\r\n' : '\n') + RBAC_COMPONENTS + (isCRLF ? '\r\n\r\n' : '\n\n') + content.slice(kcIndex);
console.log('✓ Injected RBAC components before KC');

// 2. Update q1 signature
const oldQ1Sig = 'function q1({activeTab:t,setActiveTab:e,onOpenSearch:n,theme:th,setTheme:setTh,lang:curLang="EN",setLang:setLProp}){';
const newQ1Sig = 'function q1({activeTab:t,setActiveTab:e,onOpenSearch:n,theme:th,setTheme:setTh,lang:curLang="EN",setLang:setLProp,currentUser:cuUser,onOpenAuthModal:onAuth,onLogout:onLogOut}){';
content = safeReplace(content, oldQ1Sig, newQ1Sig);

// 3. Update primaryNav
const oldPrimaryNav = `/* Primary visible nav items */
const primaryNav=[
  {id:"overview",label:isHi?"अवलोकन":"Overview",short:isHi?"अवलोकन":"Overview",icon:io,badge:null},
  {id:"weather",label:isHi?"मौसम टेलीमेट्री":"Weather",short:isHi?"मौसम":"Weather",icon:Z1,badge:"LIVE"},
  {id:"map",label:isHi?"ध्रुवीय मानचित्र":"Polar Map",short:isHi?"मानचित्र":"Map",icon:so,badge:"5★"},
  {id:"stations",label:isHi?"अनुसंधान केंद्र":"Stations",short:isHi?"केंद्र":"Stations",icon:Rl,badge:"5★"},
  {id:"researchers",label:isHi?"अनुसंधान":"Research",short:isHi?"अनुसंधान":"Research",icon:W1,badge:"5★"},
  {id:"visualizer",label:isHi?"विज़ुअलाइज़र":"Visualizer",short:isHi?"विज़ुअल":"Visualizer",icon:zl,badge:"4★"},
  {id:"graph",label:isHi?"नॉलेज ग्राफ":"Knowledge Graph",short:isHi?"ग्राफ":"Graph",icon:Cx,badge:"4★"}
];`;

const newPrimaryNav = `/* Primary visible nav items */
const primaryNav=[
  {id:"overview",label:isHi?"अवलोकन":"Overview",short:isHi?"अवलोकन":"Overview",icon:io,badge:null},
  {id:"weather",label:isHi?"मौसम टेलीमेट्री":"Weather",short:isHi?"मौसम":"Weather",icon:Z1,badge:"LIVE"},
  {id:"datasets",label:isHi?"डेटासेट":"Datasets",short:isHi?"डेटासेट":"Datasets",icon:_o,badge:"6-Tier"},
  {id:"map",label:isHi?"ध्रुवीय मानचित्र":"Polar Map",short:isHi?"मानचित्र":"Map",icon:so,badge:"5★"},
  {id:"stations",label:isHi?"अनुसंधान केंद्र":"Stations",short:isHi?"केंद्र":"Stations",icon:Rl,badge:"5★"},
  {id:"researchers",label:isHi?"अनुसंधान":"Research",short:isHi?"अनुसंधान":"Research",icon:W1,badge:"5★"},
  {id:"graph",label:isHi?"नॉलेज ग्राफ":"Knowledge Graph",short:isHi?"ग्राफ":"Graph",icon:Cx,badge:"4★"},
  ...(cuUser && cuUser.role === "admin" ? [{id:"admin",label:isHi?"समीक्षा कंसोल":"Admin Review",short:"Admin",icon:Bl,badge:"GOV"}] : [])
];`;
content = safeReplace(content, oldPrimaryNav, newPrimaryNav);

// 4. Update Desktop controls in q1
const oldDesktopControls = `    /* Search & Toggle Controls */
    u.jsxs("div",{className:"hidden lg:flex items-center space-x-1.5 2xl:space-x-2.5 flex-shrink-0",children:[
      u.jsxs("button",{onClick:n,className:"flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-slate-300 hover:text-white text-xs transition shadow-inner group",children:[
        u.jsx(ro,{className:"w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform"}),
        u.jsx("span",{className:"hidden 2xl:inline",children:isHi?"पोर्टल खोजें...":"Search Portal..."}),
        u.jsx("span",{className:"2xl:hidden",children:isHi?"खोजें":"Search"}),
        u.jsx("kbd",{className:"hidden 2xl:inline-block text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700",children:"Ctrl+K"})
      ]}),
      u.jsxs("button",{onClick:toggleLang,id:"language-toggle-btn",className:"flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-xs text-slate-300 hover:text-white transition shadow-sm cursor-pointer select-none no-translate",title:isHi?"Switch to English (अंग्रेजी में बदलें)":"Switch to Hindi (हिन्दी में बदलें)",children:[
        u.jsx(so,{className:"w-3.5 h-3.5 text-cyan-400"}),
        u.jsx("span",{className:"font-bold text-[11px] text-cyan-300 lang-label",children:isHi?"English":"हिन्दी"}),
        u.jsx("span",{className:"text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono lang-badge",children:isHi?"EN":"HI"})
      ]}),
      u.jsxs("button",{onClick:toggleTheme,id:"desktop-theme-toggle",className:"flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-semibold transition shadow-sm cursor-pointer select-none",title:isLight?"Switch to Dark Mode":"Switch to Light Mode",children:[
        isLight?u.jsx(MoonIcon,{className:"w-3.5 h-3.5 text-sky-400"}):u.jsx(B1,{className:"w-3.5 h-3.5 text-amber-400"}),
        u.jsx("span",{className:isLight?"text-sky-500":"text-amber-300",children:isLight?"Dark":"Light"})
      ]})
    ]}),`;

const newDesktopControls = `    /* Search & Toggle Controls & User Auth */
    u.jsxs("div",{className:"hidden lg:flex items-center space-x-1.5 2xl:space-x-2.5 flex-shrink-0",children:[
      u.jsxs("button",{onClick:n,className:"flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-slate-300 hover:text-white text-xs transition shadow-inner group",children:[
        u.jsx(ro,{className:"w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform"}),
        u.jsx("span",{className:"hidden 2xl:inline",children:isHi?"पोर्टल खोजें...":"Search Portal..."}),
        u.jsx("span",{className:"2xl:hidden",children:isHi?"खोजें":"Search"}),
        u.jsx("kbd",{className:"hidden 2xl:inline-block text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700",children:"Ctrl+K"})
      ]}),
      u.jsxs("button",{onClick:toggleLang,id:"language-toggle-btn",className:"flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-xs text-slate-300 hover:text-white transition shadow-sm cursor-pointer select-none no-translate",title:isHi?"Switch to English (अंग्रेजी में बदलें)":"Switch to Hindi (हिन्दी में बदलें)",children:[
        u.jsx(so,{className:"w-3.5 h-3.5 text-cyan-400"}),
        u.jsx("span",{className:"font-bold text-[11px] text-cyan-300 lang-label",children:isHi?"English":"हिन्दी"}),
        u.jsx("span",{className:"text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono lang-badge",children:isHi?"EN":"HI"})
      ]}),
      u.jsxs("button",{onClick:toggleTheme,id:"desktop-theme-toggle",className:"flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-semibold transition shadow-sm cursor-pointer select-none",title:isLight?"Switch to Dark Mode":"Switch to Light Mode",children:[
        isLight?u.jsx(MoonIcon,{className:"w-3.5 h-3.5 text-sky-400"}):u.jsx(B1,{className:"w-3.5 h-3.5 text-amber-400"}),
        u.jsx("span",{className:isLight?"text-sky-500":"text-amber-300",children:isLight?"Dark":"Light"})
      ]}),
      cuUser ? u.jsxs("div", {
        className: "flex items-center space-x-2 pl-2 border-l border-slate-700/80",
        children: [
          u.jsxs("div", {
            className: "flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-inner",
            children: [
              u.jsx("div", {
                className: "w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm",
                children: (cuUser.name || "U").charAt(0).toUpperCase()
              }),
              u.jsxs("div", {
                className: "flex flex-col text-left",
                children: [
                  u.jsx("span", { className: "text-[11px] font-bold text-white max-w-[100px] 2xl:max-w-[130px] truncate leading-tight", children: cuUser.name }),
                  u.jsx("span", {
                    className: "text-[9px] font-mono font-bold uppercase " + (cuUser.role === "admin" ? "text-amber-400" : cuUser.role === "researcher" ? "text-cyan-400" : "text-emerald-400"),
                    children: cuUser.role === "admin" ? "⚡ Admin" : cuUser.role === "researcher" ? "🔬 Researcher" : "🎓 Student"
                  })
                ]
              })
            ]
          }),
          u.jsxs("button", {
            onClick: onLogOut,
            title: "Sign Out",
            className: "px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer",
            children: [
              u.jsx("span", { children: "⏻" }),
              u.jsx("span", { className: "hidden 2xl:inline", children: "Logout" })
            ]
          })
        ]
      }) : u.jsxs("button", {
        onClick: () => onAuth && onAuth("Sign in to access verified datasets & research tools"),
        className: "px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/25 transition flex items-center space-x-1.5 cursor-pointer ml-1",
        children: [
          u.jsx("span", { children: "❄️" }),
          u.jsx("span", { children: "Sign In" })
        ]
      })
    ]}),`;
content = safeReplace(content, oldDesktopControls, newDesktopControls);

// 5. Update Mobile Controls in q1
const oldMobileControls = `    /* Mobile Controls */
    u.jsxs("div",{className:"flex xl:hidden items-center space-x-1.5",children:[
      u.jsx("button",{onClick:toggleTheme,id:"mobile-theme-toggle",className:"p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs cursor-pointer",title:isLight?"Switch to Dark Mode":"Switch to Light Mode",children:isLight?u.jsx(MoonIcon,{className:"w-4 h-4 text-sky-400"}):u.jsx(B1,{className:"w-4 h-4 text-amber-400"})}),
      u.jsx("button",{onClick:n,className:"p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 cursor-pointer",title:"Search",children:u.jsx(ro,{className:"w-4 h-4"})}),
      u.jsx("button",{onClick:()=>r(!i),className:"p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer",title:"Menu",children:i?u.jsx(Ws,{className:"w-5 h-5"}):u.jsx(I1,{className:"w-5 h-5"})})
    ]})`;

const newMobileControls = `    /* Mobile Controls */
    u.jsxs("div",{className:"flex xl:hidden items-center space-x-1.5",children:[
      cuUser ? u.jsx("button", {
        onClick: () => r(!i),
        className: "w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center mr-1",
        children: (cuUser.name || "U").charAt(0).toUpperCase()
      }) : u.jsx("button", {
        onClick: () => onAuth && onAuth("Sign in to access verified datasets & research tools"),
        className: "px-2 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[11px] mr-1",
        children: "Sign In"
      }),
      u.jsx("button",{onClick:toggleTheme,id:"mobile-theme-toggle",className:"p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs cursor-pointer",title:isLight?"Switch to Dark Mode":"Switch to Light Mode",children:isLight?u.jsx(MoonIcon,{className:"w-4 h-4 text-sky-400"}):u.jsx(B1,{className:"w-4 h-4 text-amber-400"})}),
      u.jsx("button",{onClick:n,className:"p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 cursor-pointer",title:"Search",children:u.jsx(ro,{className:"w-4 h-4"})}),
      u.jsx("button",{onClick:()=>r(!i),className:"p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer",title:"Menu",children:i?u.jsx(Ws,{className:"w-5 h-5"}):u.jsx(I1,{className:"w-5 h-5"})})
    ]})`;
content = safeReplace(content, oldMobileControls, newMobileControls);

// 6. Update ow signature
const oldOwSig = 'function ow({onNavigateToVisualizer:t}){';
const newOwSig = 'function ow({onNavigateToVisualizer:t,currentUser:cuUser,onTriggerDownload:triggerDl,onOpenUploadModal:openUpload}){';
content = safeReplace(content, oldOwSig, newOwSig);

// 7. Update ow header actions with + Upload New Dataset button
const oldOwHeaderActions = `              u.jsxs("div", {
                className: "flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0",
                children: [
                  u.jsxs("a", {
                    href: \`\${HF_REPO_BASE}/tree/main\`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]",
                    children: [
                      u.jsx(fr, {className: "w-4 h-4"}),
                      u.jsx("span", {children: "Browse Full Root Repository on HF"})
                    ]
                  }),
                  u.jsxs("div", {
                    className: "text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono",
                    children: [
                      u.jsx("span", {className: "text-emerald-400 font-bold", children: "✓ Direct Resolve CDN"}),
                      u.jsx("span", {className: "text-slate-600", children: "•"}),
                      u.jsx("span", {children: "6 Tiers • 14 Sub-folders"})
                    ]
                  })
                ]
              })`;

const newOwHeaderActions = `              u.jsxs("div", {
                className: "flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0",
                children: [
                  (cuUser && (cuUser.role === "researcher" || cuUser.role === "admin")) && u.jsxs("button", {
                    type: "button",
                    onClick: openUpload,
                    className: "px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                    children: [
                      u.jsx("span", { className: "text-base", children: "➕" }),
                      u.jsx("span", { children: "Upload New Dataset" })
                    ]
                  }),
                  u.jsxs("a", {
                    href: \`\${HF_REPO_BASE}/tree/main\`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]",
                    children: [
                      u.jsx(fr, {className: "w-4 h-4"}),
                      u.jsx("span", {children: "Browse Full Root Repository on HF"})
                    ]
                  }),
                  u.jsxs("div", {
                    className: "text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono",
                    children: [
                      u.jsx("span", {className: "text-emerald-400 font-bold", children: "✓ Direct Resolve CDN"}),
                      u.jsx("span", {className: "text-slate-600", children: "•"}),
                      u.jsx("span", {children: "6 Tiers • 14 Sub-folders"})
                    ]
                  })
                ]
              })`;
content = safeReplace(content, oldOwHeaderActions, newOwHeaderActions);

// 8. Update card download button in ow
const oldCardDownloadBtn = `                  /* Primary 1-Click Action: Direct Browser File Download */
                  u.jsxs("a", {
                    href: card.downloadUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    download: "",
                    title: \`Download \${card.name} (\${card.isSingleFile ? "Raw File" : "ZIP Bundle"})\`,
                    className: "w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer",
                    children: [
                      u.jsx(Os, {className: "w-4 h-4"}),
                      u.jsx("span", {
                        children: card.isSingleFile ? "Download Raw File" : "Download Sub-folder Bundle (ZIP)"
                      })
                    ]
                  }),`;

const newCardDownloadBtn = `                  /* Primary 1-Click Action: Protected Telemetry Download */
                  u.jsxs("button", {
                    type: "button",
                    onClick: () => {
                      if (typeof triggerDl === "function") {
                        triggerDl(card);
                      } else {
                        handleDownloadFolder(card);
                      }
                    },
                    title: \`Download \${card.name} (\${card.isSingleFile ? "Raw File" : "ZIP Bundle"})\`,
                    className: "w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer",
                    children: [
                      downloadingId === card.id ? u.jsx("span", { className: "w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" }) : u.jsx(Os, {className: "w-4 h-4"}),
                      u.jsx("span", {
                        children: downloadingId === card.id ? "Resolving Stream..." : (card.isSingleFile ? "Download Raw File" : "Download Sub-folder Bundle (ZIP)")
                      })
                    ]
                  }),`;
content = safeReplace(content, oldCardDownloadBtn, newCardDownloadBtn);

// 9. Update KC state definitions
const oldKcState = `function KC(){
const[t,e]=V.useState("overview"),
     [n,i]=V.useState(!1),
     [r,o]=V.useState(null),
     [l,c]=V.useState(null),
     [portalResId,setPortalResId]=V.useState(null),
     [portalPubId,setPortalPubId]=V.useState(null),
     [lang,setLang]=V.useState(()=>{
       if(typeof window!=="undefined"){
         return localStorage.getItem("polaris_lang")||"EN";
       }
       return "EN";
     }),
     [theme,setTheme]=V.useState(()=>{
       if(typeof window!=="undefined"){
         return localStorage.getItem("polaris_theme")||"dark";
       }
       return "dark";
     });`;

const newKcState = `function KC(){
const[t,e]=V.useState("overview"),
     [n,i]=V.useState(!1),
     [r,o]=V.useState(null),
     [l,c]=V.useState(null),
     [portalResId,setPortalResId]=V.useState(null),
     [portalPubId,setPortalPubId]=V.useState(null),
     [lang,setLang]=V.useState(()=>{
       if(typeof window!=="undefined"){
         return localStorage.getItem("polaris_lang")||"EN";
       }
       return "EN";
     }),
     [theme,setTheme]=V.useState(()=>{
       if(typeof window!=="undefined"){
         return localStorage.getItem("polaris_theme")||"dark";
       }
       return "dark";
     }),
     /* RBAC State */
     [currentUser, setCurrentUser]=V.useState(()=>{
       if(typeof window!=="undefined"){
         try{
           const saved = localStorage.getItem("polaris_user");
           return saved ? JSON.parse(saved) : null;
         }catch(e){ return null; }
       }
       return null;
     }),
     [authToken, setAuthToken]=V.useState(()=>{
       if(typeof window!=="undefined"){
         return localStorage.getItem("polaris_token") || null;
       }
       return null;
     }),
     [authModalOpen, setAuthModalOpen]=V.useState(false),
     [authModalPrompt, setAuthModalPrompt]=V.useState(""),
     [uploadModalOpen, setUploadModalOpen]=V.useState(false),
     [pendingDownloadCard, setPendingDownloadCard]=V.useState(null),
     [toast, setToast]=V.useState(null);

const showToast = (msg, type = "success") => {
  setToast({ msg, type });
  setTimeout(() => setToast(null), 5000);
};

const handleLoginSuccess = (user, token) => {
  setCurrentUser(user);
  setAuthToken(token);
  try {
    localStorage.setItem("polaris_user", JSON.stringify(user));
    localStorage.setItem("polaris_token", token);
  } catch(e){}
  setAuthModalOpen(false);
  showToast(\`Welcome back, \${user.name || user.email}! Authenticated as \${(user.role || "student").toUpperCase()}.\`);
  if (pendingDownloadCard) {
    const card = pendingDownloadCard;
    setPendingDownloadCard(null);
    triggerDownload(card, token);
  }
};

const handleLogout = () => {
  setCurrentUser(null);
  setAuthToken(null);
  try {
    localStorage.removeItem("polaris_user");
    localStorage.removeItem("polaris_token");
  } catch(e){}
  if (t === "admin") e("overview");
  showToast("Logged out of Polaris Science Hub.");
};

const triggerDownload = (card, tokenOverride = null) => {
  const token = tokenOverride || authToken || (typeof window!=="undefined" ? localStorage.getItem("polaris_token") : null);
  if (!token) {
    setPendingDownloadCard(card);
    setAuthModalPrompt("Please sign in to download scientific polar datasets");
    setAuthModalOpen(true);
    return;
  }
  showToast(\`Initiating verified download for "\${card.name}"...\`);
  const datasetId = card.id || card.fileName || "dataset";
  const downloadApiUrl = \`/api/datasets/download/\${encodeURIComponent(datasetId)}?token=\${encodeURIComponent(token)}&url=\${encodeURIComponent(card.downloadUrl)}\`;
  window.open(downloadApiUrl, "_blank");
};`;
content = safeReplace(content, oldKcState, newKcState);

// 10. Update KC return JSX block
const oldKcReturn = `return u.jsxs("div",{className:\`min-h-screen \${theme==="light"?"light-theme bg-slate-50 text-slate-900":"bg-[#040D1A] text-slate-100"} flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200\`,children:[
  u.jsx(Y1,{theme:theme}),
  u.jsx(q1,{activeTab:t,setActiveTab:e,onOpenSearch:()=>i(!0),theme:theme,setTheme:setTheme,lang:lang,setLang:setLang}),
  u.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8",children:[
    t==="overview"&&u.jsx(ew,{setActiveTab:e,onOpenSearch:()=>i(!0),onSelectStation:f=>{o(f.id),e("stations")}}),
    t==="weather"&&u.jsx(WeatherTelemetryView,{onNavigate:d}),
    t==="map"&&u.jsx(sw,{onSelectStation:f=>{o(f.id),e("stations")}}),
    t==="stations"&&u.jsx(rw,{initialStationId:r,onNavigateToMap:()=>e("map"),onNavigateToDatasets:()=>e("datasets")}),
    t==="datasets"&&u.jsx(ow,{onNavigateToVisualizer:f=>{c(f.id),e("visualizer")}}),
    t==="media"&&u.jsx(aw,{}),
    t==="timeline"&&u.jsx(lw,{}),
    t==="ai"&&u.jsx(cw,{onNavigateToStation:f=>{o(f),e("stations")},onNavigateToDataset:f=>{c(f),e("datasets")}}),
    t==="visualizer"&&u.jsx(UC,{initialDatasetId:l}),
    t==="graph"&&u.jsx($C,{onNavigateToModule:f=>e(f)}),
    t==="admin"&&u.jsx(GC,{}),
    t==="researchers"&&u.jsx(ResearchersView,{selectedId:portalResId,setSelectedId:setPortalResId,onNavigate:d}),
    t==="publications"&&u.jsx(PublicationsView,{selectedId:portalPubId,setSelectedId:setPortalPubId,onNavigate:d})
  ]}),
  u.jsx(J1,{isOpen:n,onClose:()=>i(!1),onNavigate:d}),
  u.jsx(X1,{setActiveTab:e})
]})}`;

const newKcReturn = `return u.jsxs("div",{className:\`min-h-screen \${theme==="light"?"light-theme bg-slate-50 text-slate-900":"bg-[#040D1A] text-slate-100"} flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200\`,children:[
  u.jsx(Y1,{theme:theme}),
  u.jsx(q1,{
    activeTab:t,
    setActiveTab:e,
    onOpenSearch:()=>i(!0),
    theme:theme,
    setTheme:setTheme,
    lang:lang,
    setLang:setLang,
    currentUser:currentUser,
    onOpenAuthModal:(prompt)=>{ setAuthModalPrompt(prompt || ""); setAuthModalOpen(true); },
    onLogout:handleLogout
  }),
  u.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8",children:[
    t==="overview"&&u.jsx(ew,{setActiveTab:e,onOpenSearch:()=>i(!0),onSelectStation:f=>{o(f.id),e("stations")}}),
    t==="weather"&&u.jsx(WeatherTelemetryView,{onNavigate:d}),
    t==="map"&&u.jsx(sw,{onSelectStation:f=>{o(f.id),e("stations")}}),
    t==="stations"&&u.jsx(rw,{initialStationId:r,onNavigateToMap:()=>e("map"),onNavigateToDatasets:()=>e("datasets")}),
    t==="datasets"&&u.jsx(ow,{
      onNavigateToVisualizer:f=>{c(f.id),e("visualizer")},
      currentUser:currentUser,
      onTriggerDownload:triggerDownload,
      onOpenUploadModal:()=>setUploadModalOpen(true)
    }),
    t==="media"&&u.jsx(aw,{}),
    t==="timeline"&&u.jsx(lw,{}),
    t==="ai"&&u.jsx(cw,{onNavigateToStation:f=>{o(f),e("stations")},onNavigateToDataset:f=>{c(f),e("datasets")}}),
    t==="visualizer"&&u.jsx(UC,{initialDatasetId:l}),
    t==="graph"&&u.jsx($C,{onNavigateToModule:f=>e(f)}),
    t==="admin"&&u.jsx(PolarisAdminReviewConsole,{
      currentUser:currentUser,
      authToken:authToken,
      onShowToast:showToast,
      onNavigateToDatasets:()=>e("datasets")
    }),
    t==="researchers"&&u.jsx(ResearchersView,{selectedId:portalResId,setSelectedId:setPortalResId,onNavigate:d}),
    t==="publications"&&u.jsx(PublicationsView,{selectedId:portalPubId,setSelectedId:setPortalPubId,onNavigate:d})
  ]}),
  u.jsx(J1,{isOpen:n,onClose:()=>i(!1),onNavigate:d}),
  u.jsx(X1,{setActiveTab:e}),
  u.jsx(PolarisAuthGateModal,{
    isOpen:authModalOpen,
    onClose:()=>{ setAuthModalOpen(false); setPendingDownloadCard(null); },
    onSuccess:handleLoginSuccess,
    initialPrompt:authModalPrompt
  }),
  u.jsx(PolarisDatasetUploadModal,{
    isOpen:uploadModalOpen,
    onClose:()=>setUploadModalOpen(false),
    onSuccess:(created)=>{
      setUploadModalOpen(false);
      showToast(\`Dataset "\${created.title}" submitted successfully for Admin review!\`);
    },
    currentUser:currentUser,
    authToken:authToken
  }),
  u.jsx(PolarisToast,{
    toast:toast,
    onClose:()=>setToast(null)
  })
]})}`;
content = safeReplace(content, oldKcReturn, newKcReturn);

// Save to both assetFile and distFile
fs.writeFileSync(assetFile, content, 'utf8');
console.log('✓ Successfully wrote to', assetFile);

if (fs.existsSync(distFile)) {
  fs.writeFileSync(distFile, content, 'utf8');
  console.log('✓ Successfully mirrored to', distFile);
}

console.log('All 10 RBAC Frontend patches successfully applied!');
