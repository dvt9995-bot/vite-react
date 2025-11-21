import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Users, BookOpen, Calendar, Award, 
  Search, Bell, Menu, MoreHorizontal, Heart, MessageCircle, 
  Share2, Lock, PlayCircle, CheckCircle, Globe, User,
  LogOut, Image as ImageIcon, Send, ChevronRight, Sparkles, Bot,
  Info, Tag, Shield, ChevronLeft, Plus, Clock, MapPin, X, Minimize2,
  Settings, History, LifeBuoy, Flag, AlertTriangle, CreditCard, DollarSign,
  Moon, Sun, Layout, Mail, BellRing, ShieldCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, 
  signInAnonymously, onAuthStateChanged, signOut,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, orderBy, 
  onSnapshot, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc
} from 'firebase/firestore';

// --- GEMINI API SETUP ---
const apiKey = ""; // API key will be injected by the environment

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (i === 2) throw error;
      await delay(1000 * Math.pow(2, i));
    }
  }
}

// --- CONFIGURATION & MOCK DATA ---
const MOCK_COURSES = [
  {
    id: 1,
    title: "AI-KER WORKSPACE",
    description: "Cùng mình hiểu nhanh cách hoạt động của nền tảng.",
    progress: 0,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    lessons: 5,
    tags: ["basic", "platform", "intro"]
  },
  {
    id: 2,
    title: "TIN TỨC AI-Ker",
    description: "Các tin tức mới hằng tuần được update từ AI-Ker Team!",
    progress: 10,
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
    lessons: 12,
    tags: ["news", "update"]
  },
  {
    id: 3,
    title: "WORKFLOW AI CREATIVE",
    description: "Quy trình làm việc AI sáng tạo chuyên nghiệp.",
    progress: 0,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    lessons: 8,
    tags: ["workflow", "creative", "process"]
  },
  {
    id: 4,
    title: "COMFYUI GUILD - CẤP ĐỘ CHUYÊN GIA",
    description: "Mở khóa ở cấp độ 5. Tự tay điều khiển sức mạnh AI.",
    progress: 0,
    locked: true,
    levelRequired: 5,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    lessons: 20,
    tags: ["advanced", "comfyui", "image-gen"]
  },
  {
    id: 5,
    title: "HEYGEN BASIC GUILD",
    description: "Giải pháp Video AI toàn diện với HeyGen.",
    progress: 35,
    image: "https://images.unsplash.com/photo-1535378437268-13d1d11d02a2?w=800&q=80",
    lessons: 6,
    tags: ["video", "heygen", "avatar"]
  },
  {
    id: 6,
    title: "AI STORYBOARD BASIC",
    description: "Tìm hiểu về AI Storyboard trong sáng tạo nội dung.",
    progress: 0,
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80",
    lessons: 10,
    tags: ["storyboard", "concept", "art"]
  }
];

const MOCK_MEMBERS = [
  { id: 1, name: "Thái Nhật Đăng", role: "Admin", online: true, avatar: "https://i.pravatar.cc/150?u=1", level: 9 },
  { id: 2, name: "Dương Trung Nhân", role: "Member", online: true, avatar: "https://i.pravatar.cc/150?u=2", level: 5 },
  { id: 3, name: "Kim Chi", role: "Member", online: false, avatar: "https://i.pravatar.cc/150?u=3", level: 2 },
  { id: 4, name: "Nguyên Nam", role: "Member", online: true, avatar: "https://i.pravatar.cc/150?u=4", level: 6 },
];

const TRANSLATIONS = {
  vi: {
    community: "Cộng đồng",
    classroom: "Lớp học",
    calendar: "Lịch",
    members: "Thành viên",
    leaderboard: "Bảng xếp hạng",
    about: "Về",
    searchPlaceholder: "Tìm kiếm...",
    writeSomething: "Bạn đang nghĩ gì? (Gõ ý tưởng và nhấn ✨ để AI viết giúp)",
    post: "Đăng bài",
    locked: "Mở khóa ở cấp độ",
    level: "Cấp độ",
    online: "Đang trực tuyến",
    offline: "Ngoại tuyến",
    joinDate: "Tham gia ngày",
    invite: "Mời bạn bè",
    aboutCommunity: "Cộng đồng AI-Ker!",
    aboutDesc: "Sáng tạo cùng AI. Tối ưu hóa công việc. Xây dựng Thương hiệu Cá nhân.",
    login: "Đăng nhập để tham gia",
    loginDesc: "Tham gia cộng đồng AI lớn nhất Việt Nam",
    signInGoogle: "Tiếp tục với Google",
    signInGuest: "Chế độ Khách",
    aiRewrite: "AI Viết lại",
    aiRewriteLoading: "Đang viết...",
    aiAdvisorTitle: "Cố vấn học tập AI",
    aiAdvisorDesc: "Nhập mục tiêu của bạn, AI sẽ gợi ý lộ trình học phù hợp từ các khóa học hiện có.",
    aiAdvisorPlaceholder: "Ví dụ: Tôi muốn làm video AI nói chuyện...",
    aiAdvisorBtn: "Gợi ý lộ trình",
    aiAdvisorResult: "Lời khuyên từ AI:",
    // About Tab Specifics
    private: "Riêng tư",
    price: "5 đô la/tháng",
    creator: "Bởi Toàn Thái",
    aboutTitle: "AI-Ker | Cộng đồng AI Sáng tạo",
    aboutContent: `AI không còn là chuyện tương lai. Nó đang thay đổi cách chúng ta nhìn, sáng tạo và kết nối – ngay lúc này 🤖

Tại đây, bạn sẽ:
✨ Cập nhật liên tục các công cụ và tư duy AI thị giác – từ số hóa bản thân, tạo AI Model cho thương hiệu, đến dựng concept sản phẩm AI,... (liên tục update thêm các học phần AI mới với xu hướng thị trường)

🧠 Đồng hành cùng TaiOn & team qua các buổi Q&A mỗi tuần – để không bao giờ bị lạc hậu giữa dòng chảy AI đang thay đổi từng ngày.

🤝 Góp ý, hỗ trợ, chia sẻ, cùng phát triển & tạo giá trị trong một cộng đồng sáng tạo không ngừng nghỉ.

Mỗi học phần đều xuất phát từ dự án thật, đã được ứng dụng và tạo ra giá trị thật. Và mỗi thành viên mới là một mảnh ghép làm cộng đồng này thêm mạnh.

📌 Càng vào sớm, càng nhận được nhiều. Hẹn gặp bạn trong cộng đồng AI-Ker nhé ✨`,
    // Calendar
    today: "Hôm nay",
    addEvent: "Thêm lịch",
    eventTitle: "Tên sự kiện",
    eventDate: "Ngày",
    eventTime: "Giờ",
    eventDesc: "Mô tả",
    save: "Lưu",
    cancel: "Hủy",
    delete: "Xóa",
    // Chat Widget
    chatTitle: "Trợ lý Gemini AI",
    chatPlaceholder: "Hỏi tôi bất cứ điều gì...",
    chatWelcome: "Chào bạn! Tôi là trợ lý AI của cộng đồng AI-Ker. Tôi có thể giúp gì cho bạn hôm nay?",
    // User Menu
    profile: "Hồ sơ",
    settings: "Cài đặt",
    transactionHistory: "Lịch sử giao dịch",
    contactSupport: "Liên hệ support",
    report: "Tố giác",
    reportBug: "Báo lỗi",
    logout: "Đăng xuất",
    // Settings Page
    s_communities: "Cộng đồng",
    s_profile: "Hồ sơ",
    s_affiliates: "Liên kết (Affiliates)",
    s_payouts: "Thanh toán (Payouts)",
    s_account: "Tài khoản",
    s_notifications: "Thông báo",
    s_chat: "Trò chuyện",
    s_paymethods: "Phương thức thanh toán",
    s_payhistory: "Lịch sử thanh toán",
    s_theme: "Giao diện",
    s_changePhoto: "Đổi ảnh đại diện",
    s_firstName: "Tên",
    s_lastName: "Họ",
    s_bio: "Giới thiệu",
    s_save: "Lưu thay đổi",
    s_email: "Email",
    s_changeEmail: "Đổi Email",
    s_password: "Mật khẩu",
    s_changePass: "Đổi Mật khẩu",
    s_timezone: "Múi giờ",
    s_logoutAll: "Đăng xuất tất cả thiết bị",
    s_addPay: "Thêm phương thức thanh toán"
  },
  en: {
    community: "Community",
    classroom: "Classroom",
    calendar: "Calendar",
    members: "Members",
    leaderboard: "Leaderboard",
    about: "About",
    searchPlaceholder: "Search...",
    writeSomething: "What's on your mind? (Type ideas & hit ✨ for AI magic)",
    post: "Post",
    locked: "Unlock at Level",
    level: "Level",
    online: "Online",
    offline: "Offline",
    joinDate: "Joined",
    invite: "Invite",
    aboutCommunity: "AI-Ker Community!",
    aboutDesc: "Create with AI. Optimize work. Build Personal Brand.",
    login: "Login to join",
    loginDesc: "Join the biggest AI community in Vietnam",
    signInGoogle: "Continue with Google",
    signInGuest: "Guest Mode",
    aiRewrite: "AI Rewrite",
    aiRewriteLoading: "Writing...",
    aiAdvisorTitle: "AI Learning Advisor",
    aiAdvisorDesc: "Enter your goal, and AI will suggest a learning path from available courses.",
    aiAdvisorPlaceholder: "E.g., I want to create talking AI videos...",
    aiAdvisorBtn: "Get Advice",
    aiAdvisorResult: "AI Recommendation:",
    // About Tab Specifics
    private: "Private",
    price: "$5/month",
    creator: "By Toan Thai",
    aboutTitle: "AI-Ker | Creative AI Community",
    aboutContent: `AI is no longer a thing of the future. It is changing the way we see, create and connect – right now 🤖

Here, you will:
✨ Continuously update visual AI tools and mindsets – from digitizing yourself, creating AI Models for brands, to building AI product concepts...

🧠 Accompany TaiOn & team through weekly Q&A sessions.

🤝 Contribute, support, share, develop together & create value in a restless creative community.

See you in the AI-Ker community ✨`,
    // Calendar
    today: "Today",
    addEvent: "Add Event",
    eventTitle: "Event Title",
    eventDate: "Date",
    eventTime: "Time",
    eventDesc: "Description",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    // Chat Widget
    chatTitle: "Gemini AI Assistant",
    chatPlaceholder: "Ask me anything...",
    chatWelcome: "Hello! I am the AI-Ker community assistant. How can I help you today?",
    // User Menu
    profile: "Profile",
    settings: "Settings",
    transactionHistory: "Transaction History",
    contactSupport: "Contact Support",
    report: "Report User",
    reportBug: "Report Bug",
    logout: "Log out",
    // Settings Page
    s_communities: "Communities",
    s_profile: "Profile",
    s_affiliates: "Affiliates",
    s_payouts: "Payouts",
    s_account: "Account",
    s_notifications: "Notifications",
    s_chat: "Chat",
    s_paymethods: "Payment methods",
    s_payhistory: "Payment history",
    s_theme: "Theme",
    s_changePhoto: "Change profile photo",
    s_firstName: "First Name",
    s_lastName: "Last Name",
    s_bio: "Bio",
    s_save: "Save",
    s_email: "Email",
    s_changeEmail: "Change Email",
    s_password: "Password",
    s_changePass: "Change Password",
    s_timezone: "Timezone",
    s_logoutAll: "Log out of all devices",
    s_addPay: "Add Payment Method"
  }
};

// --- FIREBASE SETUP ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ai-community-demo';

// --- HELPER FUNCTIONS & COMPONENTS ---

// Helper for emoji icon (MOVED TO TOP TO FIX REFERENCE ERROR)
const SmileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
)

const LevelBadge = ({ level }) => (
  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-sm">
    {level}
  </div>
);

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
    <div 
      className="bg-yellow-400 h-2 rounded-full transition-all duration-500" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const AuthModal = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  
  const t = TRANSLATIONS[lang];

  const handleGoogleLogin = async () => {
    try {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      onClose();
    } catch (error) {
      console.error("Login failed", error);
      await signInAnonymously(auth);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg rotate-3">
          <span className="text-white font-bold text-2xl">AI</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">{t.login}</h2>
        <p className="text-gray-500 mb-8">{t.loginDesc}</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition-all transform hover:scale-[1.02] active:scale-95 mb-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 mr-3" alt="Google" />
          {t.signInGoogle}
        </button>
         <button 
          onClick={handleGoogleLogin}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-4 rounded-xl transition-all"
        >
          {t.signInGuest}
        </button>
      </div>
    </div>
  );
};

const Post = ({ post, user }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-3">
          <div className="relative">
            <img src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.author}&background=random`} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
            {post.authorLevel && <div className="absolute -bottom-1 -right-1"><LevelBadge level={post.authorLevel} /></div>}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              {post.author}
              {post.isAdmin && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Admin</span>}
            </h3>
            <p className="text-xs text-gray-500">{post.timeAgo || "Vừa xong"}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <h2 className="font-bold text-lg mb-2 text-gray-800">{post.title}</h2>
      <p className="text-gray-600 mb-4 whitespace-pre-line leading-relaxed">{post.content}</p>

      {post.image && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-100">
          <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-96" />
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t border-gray-100 text-gray-500 text-sm font-medium">
        <button 
          onClick={() => setLiked(!liked)}
          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          <span>{post.likes + (liked ? 1 : 0)}</span>
        </button>
        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors hover:text-blue-500">
          <MessageCircle size={18} />
          <span>{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors hover:text-green-500 ml-auto">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ lang, user }) => {
  const t = TRANSLATIONS[lang];
  
  return (
    <div className="space-y-6">
      {/* About Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="h-24 bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-200 rounded-lg mb-4 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <h2 className="absolute bottom-2 left-3 text-white font-bold text-xl drop-shadow-md">AI-Worker</h2>
        </div>
        <h3 className="font-bold text-lg mb-1">{t.aboutCommunity}</h3>
        <p className="text-sm text-gray-500 mb-4">skool.com/ai-ker-8924</p>
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
          {t.aboutDesc}
        </p>
        <div className="flex justify-between text-sm font-bold text-gray-800 mb-4 px-2">
          <div className="text-center">
            <div className="text-lg">2.0k</div>
            <div className="text-xs text-gray-400 font-normal">{t.members}</div>
          </div>
          <div className="text-center">
            <div className="text-lg text-green-500">12</div>
            <div className="text-xs text-gray-400 font-normal">{t.online}</div>
          </div>
          <div className="text-center">
            <div className="text-lg">2</div>
            <div className="text-xs text-gray-400 font-normal">Admins</div>
          </div>
        </div>
        <button className="w-full py-2 rounded-lg border-2 border-yellow-400 text-yellow-600 font-bold hover:bg-yellow-50 transition-colors">
          {t.invite}
        </button>
      </div>

      {/* Mini Leaderboard */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award size={18} className="text-yellow-500" />
            Top Contributors
         </h3>
         <div className="space-y-3">
            {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {i}
                    </div>
                    <img src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                        <div className="text-sm font-semibold truncate">User Name {i}</div>
                        <div className="text-xs text-gray-400">{1000 - i*100} XP</div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const AIAssistant = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [query, setQuery] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setRecommendation("");

    const courseList = MOCK_COURSES.map(c => `- ${c.title} (${c.description})`).join("\n");
    const prompt = `Act as an expert academic advisor for an AI community. 
    Available Courses:
    ${courseList}

    User Goal: "${query}"

    Task: Recommend a specific learning path using the available courses to help the user achieve their goal.
    Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}.
    Tone: Encouraging, professional.
    Format: Keep it short (max 3 bullet points). Use emojis.`;

    try {
      const result = await callGemini(prompt);
      setRecommendation(result);
    } catch (error) {
      setRecommendation("Sorry, AI is busy right now. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-6 text-white shadow-lg mb-6">
      <div className="flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
          <Bot size={32} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            {t.aiAdvisorTitle} <Sparkles size={18} className="text-yellow-300 animate-pulse" />
          </h3>
          <p className="text-indigo-100 mb-4 text-sm">{t.aiAdvisorDesc}</p>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.aiAdvisorPlaceholder}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/20 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleGetAdvice()}
            />
            <button 
              onClick={handleGetAdvice}
              disabled={loading || !query.trim()}
              className="bg-white text-indigo-600 font-bold px-4 py-2 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={16} />}
              {t.aiAdvisorBtn}
            </button>
          </div>

          {recommendation && (
            <div className="bg-white/10 rounded-lg p-4 border border-white/10 animate-fade-in">
              <h4 className="font-bold text-yellow-300 text-sm mb-1">{t.aiAdvisorResult}</h4>
              <p className="text-sm leading-relaxed whitespace-pre-line">{recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- HELPER FUNCTIONS FOR CALENDAR ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};

// --- CALENDAR COMPONENT ---
const CalendarTab = ({ lang, user }) => {
    const t = TRANSLATIONS[lang];
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '08:00', desc: '' });
    
    // Format date helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const today = new Date();
    
    // Standard Mon-Sun week for Vietnam
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
    
    // Calculate calendar grid
    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    // JS getDay(): 0=Sun, 1=Mon...6=Sat. We want Mon start (0). 
    // Shift: Sun(0) -> 6, Mon(1)->0, Tue(2)->1...
    const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    // Pad empty days at start
    for (let i = 0; i < startDayOffset; i++) {
        days.push(null);
    }
    // Fill actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    
    // Fetch events
    useEffect(() => {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'calendar_events'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const evs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(evs);
        });
        return () => unsubscribe();
    }, []);
    
    const handleAddEvent = async () => {
        if(!newEvent.title || !newEvent.date) return;
        try {
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'calendar_events'), {
                 title: newEvent.title,
                 date: newEvent.date, // YYYY-MM-DD
                 time: newEvent.time,
                 description: newEvent.desc,
                 createdAt: serverTimestamp()
             });
             setIsModalOpen(false);
             setNewEvent({ title: '', date: '', time: '08:00', desc: '' });
        } catch(e) {
            console.error(e);
        }
    };

    const deleteEvent = async (id) => {
         if(confirm("Delete this event?")) {
             await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', id));
         }
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 border rounded-lg hover:bg-gray-50 text-sm font-semibold">
                        {t.today}
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 capitalize">
                        Tháng {month + 1} năm {year}
                    </h2>
                </div>
                <div className="text-sm text-gray-500 font-mono flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true })} giờ Sài Gòn
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} /> {t.addEvent}
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
                {daysOfWeek.map(d => (
                    <div key={d} className="py-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider border-r last:border-r-0">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr bg-white">
                {days.map((day, idx) => {
                    if (!day) return <div key={idx} className="min-h-[120px] bg-gray-50/30 border-b border-r"></div>;
                    
                    const dateStr = day.toLocaleDateString('en-CA'); // YYYY-MM-DD
                    const dayEvents = events.filter(e => e.date === dateStr);
                    const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

                    return (
                        <div key={idx} className={`min-h-[120px] p-2 border-b border-r relative hover:bg-gray-50 transition-colors group ${isToday ? 'bg-yellow-50/30' : ''}`}>
                            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-red-500 text-white shadow-md' : 'text-gray-700'}`}>
                                {day.getDate()}
                            </span>
                            <div className="space-y-1">
                                {dayEvents.map(ev => (
                                    <div key={ev.id} className="text-xs bg-blue-50 text-blue-700 p-1.5 rounded border border-blue-100 hover:bg-blue-100 cursor-pointer group/event relative">
                                        <div className="font-bold truncate">{ev.time} - {ev.title}</div>
                                        {user && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/event:opacity-100 w-4 h-4 flex items-center justify-center"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{t.addEvent}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.eventTitle}</label>
                                <input 
                                    type="text" 
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.eventDate}</label>
                                    <input 
                                        type="date" 
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.eventTime}</label>
                                    <input 
                                        type="time" 
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.eventDesc}</label>
                                <textarea 
                                    value={newEvent.desc}
                                    onChange={e => setNewEvent({...newEvent, desc: e.target.value})}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none h-24 resize-none"
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50 font-medium text-gray-600">{t.cancel}</button>
                                <button onClick={handleAddEvent} className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-bold shadow-sm">{t.save}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- CHAT WIDGET COMPONENT ---
const ChatWidget = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: t.chatWelcome }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    try {
      const prompt = `You are a helpful AI Assistant for the 'AI-Ker' community.
      User said: "${userMsg}"
      Answer in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      Keep it friendly, helpful, and relevant to AI or community topics.`;
      
      const reply = await callGemini(prompt);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the AI brain right now." }]);
    }
    setIsThinking(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold text-sm">{t.chatTitle}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
               <div className="flex justify-start">
                 <div className="bg-white p-3 rounded-xl rounded-bl-none border border-gray-200 shadow-sm flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.chatPlaceholder}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-gray-700' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse hover:animate-none'} text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 group relative`}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
        {!isOpen && (
           <span className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
        )}
      </button>
    </div>
  );
};

// --- SETTINGS PAGE COMPONENTS ---

const SettingsSidebar = ({ activeTab, setActiveTab, t }) => {
  const menuItems = [
    { id: 'communities', label: t.s_communities },
    { id: 'profile', label: t.s_profile },
    { id: 'affiliates', label: t.s_affiliates },
    { id: 'payouts', label: t.s_payouts },
    { id: 'account', label: t.s_account },
    { id: 'notifications', label: t.s_notifications },
    { id: 'chat', label: t.s_chat },
    { id: 'payment_methods', label: t.s_paymethods },
    { id: 'payment_history', label: t.s_payhistory },
    { id: 'theme', label: t.s_theme },
  ];

  return (
    <div className="w-64 flex-shrink-0 bg-white md:bg-transparent">
      <div className="py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === item.id 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SettingsContent = ({ activeTab, t, user }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">{t.s_profile}</h2>
            <div className="flex items-center gap-4 mb-8">
              <img src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} className="w-16 h-16 rounded-full border" />
              <button className="text-blue-600 font-semibold text-sm hover:underline">{t.s_changePhoto}</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t.s_firstName}</label>
                <input type="text" defaultValue="Tuan" className="w-full border rounded p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t.s_lastName}</label>
                <input type="text" defaultValue="Dang" className="w-full border rounded p-2 text-sm" />
              </div>
            </div>
            <div className="mb-4">
               <label className="block text-xs text-gray-500 mb-1">URL</label>
               <input type="text" defaultValue="skool.com/@tuan-dang-5655" className="w-full border rounded p-2 text-sm bg-gray-50" disabled />
            </div>
            <div className="mb-6">
               <label className="block text-xs text-gray-500 mb-1">{t.s_bio}</label>
               <textarea className="w-full border rounded p-2 text-sm h-24 resize-none" placeholder="1"></textarea>
               <div className="text-right text-xs text-gray-400 mt-1">1 / 150</div>
            </div>
            <button className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded shadow-sm">
               {t.s_save}
            </button>
          </div>
        );
      
      case 'communities':
        return (
          <div className="max-w-2xl">
             <h2 className="text-2xl font-bold mb-2">{t.s_communities}</h2>
             <p className="text-gray-500 text-sm mb-6">Drag and drop to reorder, pin to sidebar, or hide.</p>
             <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-white font-bold">AI</div>
                   <span className="font-bold">AI-Ker | Cộng đồng AI Sáng tạo</span>
                </div>
                <div className="flex gap-2 text-gray-400">
                   <button className="px-3 py-1 border rounded text-xs font-bold text-gray-600 hover:bg-gray-50">SETTINGS</button>
                   <button className="p-1 hover:text-gray-600"><Globe size={18} /></button>
                   <button className="p-1 hover:text-gray-600"><Tag size={18} /></button>
                </div>
             </div>
          </div>
        );

      case 'affiliates':
        return (
          <div className="max-w-2xl">
             <h2 className="text-2xl font-bold mb-2">{t.s_affiliates}</h2>
             <p className="text-gray-500 text-sm mb-6">Earn commission for life when you invite somebody to create or join a Skool community.</p>
             
             <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 border rounded-lg p-4 text-center">
                   <div className="text-2xl font-bold text-gray-800">$0</div>
                   <div className="text-xs text-gray-500">Last 30 days</div>
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 text-center">
                   <div className="text-2xl font-bold text-gray-800">$0</div>
                   <div className="text-xs text-gray-500">Lifetime</div>
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 flex flex-col items-center justify-center">
                   <div className="text-2xl font-bold text-green-500">$0</div>
                   <div className="text-xs text-gray-500 mb-2">Account balance</div>
                   <button className="text-xs bg-gray-200 text-gray-400 px-3 py-1 rounded font-bold cursor-not-allowed">PAYOUT</button>
                </div>
             </div>

             <div className="mb-6">
                <label className="font-bold text-sm block mb-2">Your affiliate links</label>
                <div className="flex gap-2 mb-2">
                   <button className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-bold">Skool platform</button>
                   <button className="px-3 py-1 border rounded-full text-xs text-gray-600">AI-Ker | Cộng đồng AI Sáng tạo</button>
                </div>
                <p className="text-sm text-gray-600 mb-2">Earn <span className="font-bold">40% commission</span> when you invite somebody to create a Skool community.</p>
                <div className="flex gap-2">
                   <input type="text" value="https://www.skool.com/signup?ref=cbd9b86ab5" readOnly className="flex-1 border rounded px-3 py-2 text-sm text-blue-600 bg-gray-50" />
                   <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-6 rounded">COPY</button>
                </div>
             </div>
          </div>
        );

      case 'payouts':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8 min-h-[300px]">
              <div className="flex justify-between items-start mb-2">
                 <h2 className="text-xl font-bold">{t.s_payouts}</h2>
                 <Settings size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-8">Payouts for community and affiliate earnings.</p>
              <p className="text-gray-400 text-sm">No payouts yet</p>
           </div>
        );

      case 'account':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8">
              <h2 className="text-xl font-bold mb-6">{t.s_account}</h2>
              
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                 <div>
                    <div className="font-bold text-sm mb-1">{t.s_email}</div>
                    <div className="text-sm text-gray-600">{user?.email || "dvt9995@gmail.com"}</div>
                 </div>
                 <button className="px-4 py-2 border rounded text-xs font-bold text-gray-600 hover:bg-gray-50">{t.s_changeEmail}</button>
              </div>

              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                 <div>
                    <div className="font-bold text-sm mb-1">{t.s_password}</div>
                    <div className="text-sm text-gray-600">Change your password</div>
                 </div>
                 <button className="px-4 py-2 border rounded text-xs font-bold text-gray-600 hover:bg-gray-50">{t.s_changePass}</button>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-100">
                 <div className="font-bold text-sm mb-2">{t.s_timezone}</div>
                 <select className="w-full border rounded p-2 text-sm text-gray-700">
                    <option>(GMT +07:00) Asia/Saigon</option>
                 </select>
              </div>

              <div className="flex justify-between items-center">
                 <div>
                    <div className="font-bold text-sm mb-1">{t.s_logoutAll}</div>
                    <div className="text-sm text-gray-600">Log out of all active sessions on all devices.</div>
                 </div>
                 <button className="px-4 py-2 border rounded text-xs font-bold text-gray-600 hover:bg-gray-50">LOG OUT EVERYWHERE</button>
              </div>
           </div>
        );

      case 'notifications':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8">
              <h2 className="text-xl font-bold mb-6">{t.s_notifications}</h2>
              <div className="space-y-6">
                 {[
                    "New follower notification", 
                    "New affiliate referral email notification", 
                    "New customer ka-ching sound"
                 ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                       <span className="text-sm text-gray-700">{item}</span>
                       <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                       </div>
                    </div>
                 ))}
                 
                 <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
                       <div>
                          <div className="font-bold text-sm">AI-Ker | Cộng đồng AI Sáng tạo</div>
                          <div className="text-xs text-gray-500">Weekly digest • Hourly bundle</div>
                       </div>
                    </div>
                    <button className="px-4 py-2 border rounded text-xs font-bold text-gray-600 hover:bg-gray-50">CHANGE</button>
                 </div>
              </div>
           </div>
        );

      case 'chat':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8">
              <div className="space-y-8">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="font-bold text-sm">Notifications</h3>
                       <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                    </div>
                    <p className="text-xs text-gray-500">Notify me with sound and blinking tab header when somebody messages me.</p>
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="font-bold text-sm">Email notifications</h3>
                       <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                    </div>
                    <p className="text-xs text-gray-500">If you're offline and somebody messages you, we'll let you know via email.</p>
                 </div>

                 <div>
                    <h3 className="font-bold text-sm mb-2">Who can message me?</h3>
                    <p className="text-xs text-gray-500 mb-4">Only members in the group you're in can message you.</p>
                    <div className="flex items-center justify-between border p-3 rounded-lg">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-white font-bold text-xs">AI</div>
                          <span className="text-sm font-bold">AI-Ker | Cộng đồng AI Sáng tạo</span>
                       </div>
                       <button className="px-3 py-1 border rounded text-xs font-bold text-gray-600 flex items-center gap-1">
                          <MessageCircle size={14} /> ON
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        );

      case 'payment_methods':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">{t.s_paymethods}</h2>
                 <button className="px-4 py-2 bg-yellow-200 text-yellow-800 font-bold text-xs rounded hover:bg-yellow-300">
                    {t.s_addPay}
                 </button>
              </div>
              <p className="text-gray-400 text-sm">No cards on file</p>
           </div>
        );

      case 'payment_history':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">{t.s_payhistory}</h2>
                 <Settings size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm">You have no payments.</p>
           </div>
        );

      case 'theme':
        return (
           <div className="max-w-3xl bg-white border rounded-lg p-8">
              <h2 className="text-xl font-bold mb-6">{t.s_theme}</h2>
              <div className="mb-6">
                 <label className="block text-xs text-gray-500 mb-1">Theme</label>
                 <select className="w-full border rounded p-2 text-sm text-gray-700">
                    <option>Light (default)</option>
                    <option>Dark</option>
                 </select>
              </div>
              <button className="w-full py-2 bg-gray-200 text-gray-400 font-bold rounded text-sm cursor-not-allowed">SAVE</button>
           </div>
        );

      default:
        return <div>Select a setting</div>;
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-white md:bg-transparent">
      {renderContent()}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('community');
  const [lang, setLang] = useState('vi');
  const [posts, setPosts] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // New state for view management
  const [currentView, setCurrentView] = useState('main'); // 'main' | 'settings'
  const [activeSettingTab, setActiveSettingTab] = useState('profile');

  const t = TRANSLATIONS[lang];

  // Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        // Fallback
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsAuthModalOpen(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Realtime Posts Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postData.length > 0 ? postData : [
        {
            id: 'mock1',
            author: 'Thái Nhật Đăng',
            authorAvatar: 'https://i.pravatar.cc/150?u=1',
            authorLevel: 9,
            isAdmin: true,
            title: 'AI Creative đang thật sự vào guồng! 🔥',
            content: 'Hôm nay mình vừa có buổi sharing cùng team Algorithm & Orés Vietnam – một agency lớn và rất sáng tạo trong ngành. Chúng mình đã cùng nhau nói về tư duy sử dụng AI.',
            likes: 44,
            comments: 53,
            image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
            createdAt: Date.now()
        },
        {
            id: 'mock2',
            author: 'Kể chuyện Kim Chi',
            authorAvatar: 'https://i.pravatar.cc/150?u=3',
            authorLevel: 2,
            title: 'Câu hỏi về Prompt Engineering',
            content: 'Mọi người cho mình hỏi cách tối ưu prompt cho Midjourney v6 để tạo ra ảnh phong cách anime thập niên 90 với ạ?',
            likes: 12,
            comments: 8,
            createdAt: Date.now() - 10000
        }
      ]);
    }, (error) => {
        console.error("Error fetching posts:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // ... existing handlers (handlePost, handleAiRewrite, handleLogout) ...
  const handlePost = async () => {
    if (!postContent.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), {
        author: user.displayName || 'Thành viên mới',
        authorAvatar: user.photoURL,
        authorLevel: 1,
        content: postContent,
        title: postContent.slice(0, 30) + '...',
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      });
      setPostContent("");
    } catch (e) {
      console.error("Error adding post: ", e);
    }
  };

  const handleAiRewrite = async () => {
    if (!postContent.trim()) return;
    setIsAiWriting(true);
    const prompt = `Rewrite the following text to be an engaging social media post for an AI community. 
    Text: "${postContent}"
    Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}
    Tone: Friendly, excited, professional. Add emojis. Keep it concise.`;
    
    try {
      const result = await callGemini(prompt);
      setPostContent(result);
    } catch (e) {
      console.error("AI Rewrite failed", e);
    }
    setIsAiWriting(false);
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setIsUserMenuOpen(false);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  // Helper to switch to Settings view
  const goToSettings = () => {
    setCurrentView('settings');
    setIsUserMenuOpen(false);
  };

  // Helper to switch back to Main view
  const goToHome = () => {
    setCurrentView('main');
    setActiveTab('community');
  };

  // Render Content based on Tab (Main View)
  const renderMainContent = () => {
    switch (activeTab) {
      case 'calendar':
          return <CalendarTab lang={lang} user={user} />;
      case 'about':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* ... existing About content ... */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.aboutTitle}</h2>
            <div className="aspect-video bg-gray-900 rounded-xl mb-4 relative overflow-hidden group cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80" 
                alt="Community Intro" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={64} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                 <h3 className="font-bold text-lg shadow-sm">Giới thiệu AI-Ker Platform</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 border-b border-gray-100 pb-6 mb-6">
                <div className="flex items-center gap-2 text-gray-600"><Lock size={20} /><span className="font-medium">{t.private}</span></div>
                <div className="flex items-center gap-2 text-gray-600"><Users size={20} /><span className="font-medium">2k {t.members.toLowerCase()}</span></div>
                <div className="flex items-center gap-2 text-gray-600"><Tag size={20} /><span className="font-medium">{t.price}</span></div>
                <div className="flex items-center gap-2 text-gray-600"><img src="https://i.pravatar.cc/150?u=1" className="w-6 h-6 rounded-full" /><span className="font-medium">{t.creator}</span></div>
            </div>
            <div className="prose prose-yellow max-w-none text-gray-700 whitespace-pre-line leading-relaxed">{t.aboutContent}</div>
          </div>
        );
      case 'classroom':
        return (
          <div>
            <AIAssistant lang={lang} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_COURSES.map((course) => (
                <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                  <div className="relative h-40 overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {course.locked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <Lock size={24} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t.locked} {course.levelRequired}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 line-clamp-1 mb-1" title={course.title}>{course.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{course.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>{course.lessons} lessons</span>
                      <span>{course.progress}%</span>
                    </div>
                    <ProgressBar progress={course.progress} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'members':
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">All Members</h2>
                    <span className="bg-white px-3 py-1 rounded-full text-xs border shadow-sm text-gray-500">Total: 2056</span>
                </div>
                {MOCK_MEMBERS.map((member) => (
                    <div key={member.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-4">
                        <div className="relative">
                            <img src={member.avatar} className="w-10 h-10 rounded-full" />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${member.online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-800">{member.name}</h4>
                                {member.role === 'Admin' && <Award size={14} className="text-yellow-500" />}
                            </div>
                            <div className="text-xs text-gray-500 flex gap-2">
                                <span>Level {member.level}</span>
                                <span>•</span>
                                <span>{member.online ? t.online : t.offline}</span>
                            </div>
                        </div>
                        <button className="px-3 py-1 text-xs border rounded hover:bg-gray-100">Chat</button>
                    </div>
                ))}
            </div>
        );
      case 'leaderboard':
          return (
            <div className="space-y-6">
                {/* ... existing Leaderboard ... */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                     <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-yellow-300 to-orange-400 mb-4">
                        <img src={user?.photoURL || "https://i.pravatar.cc/150"} className="w-24 h-24 rounded-full border-4 border-white" />
                     </div>
                     <h2 className="text-xl font-bold text-gray-800">{user?.displayName || "Guest User"}</h2>
                     <div className="text-sm text-yellow-600 font-semibold mb-2">Level 1</div>
                     <div className="text-xs text-gray-400 mb-6">4 XP to next level</div>
                     <div className="grid grid-cols-3 gap-4 text-left max-w-md mx-auto">
                        {[1,2,3,4,5,6].map(lvl => (
                            <div key={lvl} className={`p-3 rounded-lg border flex items-center gap-3 ${lvl === 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 opacity-60'}`}>
                                <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-sm font-bold">{lvl}</div>
                                <div className="text-xs">
                                    <div className="font-bold text-gray-700">Level {lvl}</div>
                                    <div className="text-[10px] text-gray-500">{lvl === 1 ? 'Current' : 'Locked'}</div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['7 Days', '30 Days', 'All Time'].map((period, idx) => (
                        <div key={period} className="bg-white p-4 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">{period}</h3>
                            {[1,2,3,4,5].map((rank) => (
                                <div key={rank} className="flex items-center gap-3 mb-3">
                                    <div className={`font-bold w-4 ${rank <= 3 ? 'text-yellow-600' : 'text-gray-400'}`}>{rank}</div>
                                    <img src={`https://i.pravatar.cc/150?u=${rank*10 + idx}`} className="w-8 h-8 rounded-full" />
                                    <div className="text-sm truncate flex-1">User {rank*12}</div>
                                    <div className="text-xs text-gray-400 font-mono">{1000 - rank*50}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
          );
      default: // community
        return (
          <div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex gap-4 mb-3">
                   <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Guest"} className="w-10 h-10 rounded-full" />
                   <div className="flex-1 relative">
                    <textarea 
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder={t.writeSomething}
                        className="w-full bg-gray-50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-200 transition-all resize-none h-20"
                    />
                    {isAiWriting && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                            <span className="flex items-center gap-2 text-sm font-bold text-purple-600 animate-pulse">
                                <Sparkles size={16} /> {t.aiRewriteLoading}
                            </span>
                        </div>
                    )}
                   </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                   <div className="flex gap-2 text-gray-400">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ImageIcon size={20} /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><PlayCircle size={20} /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><SmileIcon /></button>
                   </div>
                   <div className="flex gap-3">
                        <button 
                            onClick={handleAiRewrite}
                            disabled={!postContent.trim() || isAiWriting}
                            className="text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                            title="AI Magic Writer"
                        >
                            <Sparkles size={16} /> {t.aiRewrite}
                        </button>
                        <button 
                            onClick={handlePost}
                            disabled={!postContent.trim() || isAiWriting}
                            className="bg-yellow-400 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {t.post} <Send size={16} />
                        </button>
                   </div>
                </div>
             </div>
             <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm font-medium whitespace-nowrap">Mới nhất</button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full text-sm font-medium whitespace-nowrap">Nổi bật</button>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full text-sm font-medium whitespace-nowrap">Thảo luận</button>
             </div>
             {posts.map(post => (
               <Post key={post.id} post={post} user={user} />
             ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={goToHome}>
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">AI</div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Al-Ker</span>
            </div>
            {currentView === 'main' && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  className="bg-gray-100 pl-10 pr-4 py-2 rounded-full text-sm w-64 focus:bg-white focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
             >
                <span className="text-xs font-bold uppercase">{lang}</span>
             </button>
             <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <MessageSquare size={20} />
             </button>
             
             {/* User Dropdown */}
             <div className="relative">
                 <div 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 cursor-pointer hover:ring-2 hover:ring-yellow-200 transition-all"
                 >
                    <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Guest"} alt="User" />
                 </div>

                 {isUserMenuOpen && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                     <div className="absolute top-10 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up origin-top-right">
                        <div className="p-4 border-b border-gray-100">
                            <div className="font-bold text-gray-900 truncate">{user?.email || "guest@example.com"}</div>
                        </div>
                        <div className="py-2">
                            <button onClick={() => { goToSettings(); setActiveSettingTab('profile'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-3 transition-colors">
                                <User size={18} /> {t.profile}
                            </button>
                            <button onClick={() => { goToSettings(); setActiveSettingTab('profile'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-3 transition-colors">
                                <Settings size={18} /> {t.settings}
                            </button>
                            <button onClick={() => { goToSettings(); setActiveSettingTab('payment_history'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-3 transition-colors">
                                <History size={18} /> {t.transactionHistory}
                            </button>
                            
                            <div className="h-px bg-gray-100 my-1 mx-4"></div>
                            
                            <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-3 transition-colors">
                                <LifeBuoy size={18} /> {t.contactSupport}
                            </button>
                            <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-3 transition-colors">
                                <Flag size={18} /> {t.report}
                            </button>
                            <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-3 transition-colors">
                                <AlertTriangle size={18} /> {t.reportBug}
                            </button>
                            
                            <div className="h-px bg-gray-100 my-1 mx-4"></div>

                            <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-400 hover:text-red-500 font-medium flex items-center gap-3 transition-colors">
                                <LogOut size={18} /> {t.logout}
                            </button>
                        </div>
                     </div>
                   </>
                 )}
             </div>
          </div>
        </div>
        
        {/* Navigation Tabs (Only in Main View) */}
        {currentView === 'main' && (
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto scrollbar-hide">
             <nav className="flex gap-8 text-sm font-medium text-gray-500 min-w-max">
                {['community', 'classroom', 'calendar', 'members', 'leaderboard', 'about'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent hover:text-gray-700'}`}
                  >
                     {t[tab]}
                  </button>
                ))}
             </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentView === 'main' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
               {renderMainContent()}
            </div>
            <div className="hidden lg:block lg:col-span-1">
               <Sidebar lang={lang} user={user} />
            </div>
          </div>
        ) : (
          // Settings View Layout
          <div className="flex flex-col md:flex-row gap-8">
             <SettingsSidebar activeTab={activeSettingTab} setActiveTab={setActiveSettingTab} t={t} />
             <SettingsContent activeTab={activeSettingTab} t={t} user={user} />
          </div>
        )}
      </main>

      <ChatWidget lang={lang} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} lang={lang} />
    </div>
  );
};

export default App;
