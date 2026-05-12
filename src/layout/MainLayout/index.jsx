import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, ChevronRight } from "lucide-react";
import menuItems from "../../menu-items";
import Button from "@components/ui/Button";
import { useToast } from "@contexts/ToastContext";
import { useAuth } from "@contexts/AuthContext";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { addToast } = useToast();
  const { logout, user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminItems = menuItems.items[0]; // Get admin items

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    addToast("ออกจากระบบเรียบร้อยแล้ว", "info");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8faf6] flex font-['Noto_Sans_Thai']">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#003527] text-white transition-all duration-300 flex flex-col
          ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:w-20"}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          {(isSidebarOpen || !isSidebarOpen) && (
            <div className={`flex items-center gap-3 ${!isSidebarOpen && "md:hidden"}`}>
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-emerald-400"
                >
                  <path d="M3 21h18" />
                  <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
                </svg>
              </div>
              {isSidebarOpen && (
                <span className="font-bold text-sm tracking-tight">
                  CMS SYSTEM
                </span>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 text-white hover:bg-white/10"
            icon={isSidebarOpen ? X : Menu}
          />
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-grow mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;

            return (
              <Link
                key={item.id}
                to={item.url}
                onClick={() => {
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-md transition-all group relative
                  ${
                    isActive
                      ? "bg-[#244b3f] text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isSidebarOpen && (
                  <div className="flex-grow flex items-center justify-between">
                    <span className="text-sm font-medium">{item.title}</span>
                    {isActive && (
                      <ChevronRight size={14} className="opacity-50" />
                    )}
                  </div>
                )}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-[#003527] text-xs rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-[60] border border-white/10">
                    {item.title}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div
            className={`flex items-center gap-3 ${isSidebarOpen ? "px-2" : "flex-col justify-center"}`}
          >
            {/* Avatar & Info Container */}
            <div className="flex items-center gap-3 flex-grow min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#244b3f] flex items-center justify-center text-white font-bold shrink-0 border border-white/10">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              {isSidebarOpen && (
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold truncate text-white">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                    {role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                  </p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={`
                flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer
                ${
                  isSidebarOpen
                    ? "w-9 h-9 bg-white/5 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 border border-white/5"
                    : "w-10 h-10 text-rose-300 hover:bg-rose-500/10"
                }
              `}
              title="ออกจากระบบ"
            >
              <LogOut size={isSidebarOpen ? 18 : 22} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-grow transition-all duration-300 min-w-0
          ${isSidebarOpen ? "md:ml-72" : "md:ml-20"}
        `}
      >
        {/* Content Area */}
        <div className="min-h-screen w-full">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-8 text-center scale-in-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[#003527] mb-2 font-['Noto_Sans_Thai']">
              ยืนยันออกจากระบบ
            </h2>
            <p className="text-[#555] text-base mb-10">
              คุณต้องการสิ้นสุดการใช้งานในขณะนี้ใช่หรือไม่?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="secondary"
                className="w-full py-3"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700"
                onClick={handleLogout}
              >
                ยืนยัน
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
