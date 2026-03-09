"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface FacultyMe {
  name: string;
  permissions: {
    can_verify_certificates: boolean;
    can_verify_projects: boolean;
    can_verify_internships: boolean;
  };
  verification_stats: {
    verified_count: number;
    rejected_count: number;
  };
}

export default function FacultyDashboard() {
  const [me, setMe] = useState<FacultyMe | null>(null);

  useEffect(() => {
    fetch(`${API}/faculty/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setMe);
  }, []);

  if (!me) return <p className="text-gray-600 p-4 text-sm sm:text-base">Loading...</p>;

  return (
    <div className="space-y-6 sm:space-y-8 p-4">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
          Welcome, <span className="break-words">{me.name}</span>
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">Faculty Dashboard</p>
      </div>

      {/* Permissions */}
      <div>
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Permissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <PermissionCard
            label="Certificates"
            enabled={me.permissions?.can_verify_certificates ?? false}
          />
          <PermissionCard
            label="Projects"
            enabled={me.permissions.can_verify_projects ?? false}
          />
          <PermissionCard
            label="Internships"
            enabled={me.permissions.can_verify_internships ?? false}
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Verification Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Approved"
            value={me.verification_stats.verified_count}
          />
          <StatCard
            label="Rejected"
            value={me.verification_stats.rejected_count}
          />
        </div>
      </div>
    </div>
  );
}

function PermissionCard({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className={`p-3 sm:p-4 rounded-lg border ${enabled ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${enabled ? "bg-green-500" : "bg-gray-400"}`}></div>
        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{label}</p>
      </div>
      <p className={`text-xs sm:text-sm ${enabled ? "text-green-700" : "text-gray-600"}`}>
        {enabled ? "Can verify submissions" : "Cannot verify submissions"}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
      <p className="text-xs sm:text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}