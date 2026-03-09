"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { href: "/dashboard/faculty", label: "Dashboard" },
    { href: "/dashboard/faculty/approvals", label: "Pending Approvals" },
    { href: "/dashboard/faculty/marks", label: "Upload Marks" },
    { href: "/dashboard/faculty/internships", label: "Internship Approvals" },
    { href: "/dashboard/faculty/projects", label: "Review Projects" },
  ];

  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    
    setIsLoggingOut(true);
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  // Close sidebar when route changes (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen && window.innerWidth < 768) {
        const sidebar = document.querySelector('aside');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">Faculty</span>
            </div>
          </div>
          <div className="text-sm text-gray-600 truncate max-w-[120px]">
            {menuItems.find(item => item.href === pathname)?.label || "Dashboard"}
          </div>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile */}
      <aside className={`
        fixed md:static top-0 left-0 bottom-0 z-40
        w-64 md:w-56
        border-r border-gray-200 bg-white
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 h-full flex flex-col">
          {/* Logo/Header */}
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Faculty Panel</h2>
              <p className="text-xs text-gray-500">Smart Student Hub</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.href === "/dashboard/faculty/projects" && (
                    <span className="text-blue-600">→</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-4 p-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Logging out...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </>
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden mt-2 p-3 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Close Menu
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 mt-14 md:mt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}