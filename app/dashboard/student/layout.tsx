"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StudentGuard from "./StudentGuard";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();
      setProfileCompleted(data?.status?.profile_completed === true);
    };

    fetchMe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Loading state
  if (profileCompleted === null) {
    return null;
  }

  const menuItems = [
    { 
      href: "/dashboard/student", 
      label: "Dashboard",
      requiresProfile: true 
    },
    { 
      href: "/dashboard/student/marks", 
      label: "Marks",
      requiresProfile: true 
    },
    { 
      href: "/dashboard/student/certificates", 
      label: "Upload Certificates",
      requiresProfile: true 
    },
    { 
      href: "/dashboard/student/internships", 
      label: "Upload Internships",
      requiresProfile: true 
    },
    { 
      href: "/dashboard/student/projects", 
      label: "Submit Projects",
      requiresProfile: true 
    },
    { 
      href: "/dashboard/student/documents", 
      label: "Approved Documents",
      requiresProfile: true 
    },
    { 
      href: "/dashboard/student/profile", 
      label: "Complete Profile",
      requiresProfile: false 
    },
    { 
      href: "/dashboard/student/complaints", 
      label: "Complaints",
      requiresProfile: false 
    },
  ];

  const isDisabled = (requiresProfile: boolean) => 
    requiresProfile && !profileCompleted;

  return (
    <StudentGuard>
      <div className="flex h-screen bg-white">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-sm font-semibold text-gray-900">Student</h1>
              </div>
            </div>
            <div className="text-sm text-gray-600 truncate max-w-[120px]">
              {menuItems.find(item => item.href === pathname)?.label || "Dashboard"}
            </div>
          </div>
        </header>

        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-gray-200 bg-white">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Panel</h2>
                <p className="text-xs text-gray-500">Smart Student Hub</p>
              </div>
            </div>
          </div>

          {/* Profile Warning */}
          {!profileCompleted && (
            <div className="mx-4 mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-yellow-800 text-xs">
                ⚠️ Your profile is incomplete. Complete it to unlock all features.
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const disabled = isDisabled(item.requiresProfile);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      disabled 
                        ? "text-gray-400 cursor-not-allowed" 
                        : isActive
                          ? "bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      disabled ? "bg-gray-300" : 
                      isActive ? "bg-blue-600" : "bg-gray-300"
                    }`}></div>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:hidden
        `}>
          <div className="p-4 h-full flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Student Panel</h2>
                  <p className="text-xs text-gray-500">Smart Student Hub</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Warning - Mobile */}
            {!profileCompleted && (
              <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-yellow-800 text-xs">
                  ⚠️ Profile incomplete. Complete it to unlock all features.
                </p>
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="space-y-1 flex-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const disabled = isDisabled(item.requiresProfile);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-lg transition ${
                      disabled 
                        ? "text-gray-400 cursor-not-allowed" 
                        : isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      disabled ? "bg-gray-300" : 
                      isActive ? "bg-blue-600" : "bg-gray-300"
                    }`}></div>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Close */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-4 p-3 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Close Menu
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page Header - Desktop */}
          <div className="hidden md:block border-b border-gray-200 bg-white px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {menuItems.find(item => item.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>
          
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </StudentGuard>
  );
}