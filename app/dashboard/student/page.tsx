"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Certificate {
  status: "pending" | "approved" | "rejected";
}

interface StudentMe {
  name: string;
  email: string;
  register_no?: string;
  academic?: {
    department?: string;
    batch_year?: number;
    program?: string;
  };
  certificates?: Certificate[];
}

export default function StudentDashboard() {
  const [me, setMe] = useState<StudentMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/students/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600">Unable to load student data</p>
      </div>
    );
  }

  const pending = me.certificates?.filter((c) => c.status === "pending").length || 0;
  const approved = me.certificates?.filter((c) => c.status === "approved").length || 0;
  const rejected = me.certificates?.filter((c) => c.status === "rejected").length || 0;
  const total = me.certificates?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back, {me.name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Here's your academic overview and document status
        </p>
      </div>

      {/* Student Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
        <h2 className="font-medium text-gray-900 mb-4 text-lg">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-medium">EMAIL</p>
              <p className="text-gray-900">{me.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">REGISTER NO</p>
              <p className="text-gray-900">{me.register_no || "Not set"}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-medium">DEPARTMENT</p>
              <p className="text-gray-900">{me.academic?.department || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">BATCH YEAR</p>
              <p className="text-gray-900">{me.academic?.batch_year || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Documents" 
          value={total}
          color="bg-blue-50 text-blue-700 border-blue-200"
        />
        <StatCard 
          label="Pending Approval" 
          value={pending}
          color="bg-yellow-50 text-yellow-700 border-yellow-200"
        />
        <StatCard 
          label="Approved" 
          value={approved}
          color="bg-green-50 text-green-700 border-green-200"
        />
        <StatCard 
          label="Rejected" 
          value={rejected}
          color="bg-red-50 text-red-700 border-red-200"
        />
      </div>

      {/* Quick Stats */}
      {total > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
          <h2 className="font-medium text-gray-900 mb-4 text-lg">Document Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Approval Rate</span>
              <span className="font-medium text-gray-900">
                {total > 0 ? ((approved / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${total > 0 ? (approved / total) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {approved} of {total} documents approved
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
        <h2 className="font-medium text-gray-900 mb-4 text-lg">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <p className="font-medium text-gray-900 text-sm">Upload Certificate</p>
            <p className="text-gray-500 text-xs mt-1">Submit new certificates for verification</p>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <p className="font-medium text-gray-900 text-sm">View Marks</p>
            <p className="text-gray-500 text-xs mt-1">Check your academic performance</p>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <p className="font-medium text-gray-900 text-sm">Submit Project</p>
            <p className="text-gray-500 text-xs mt-1">Upload project details for review</p>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <p className="font-medium text-gray-900 text-sm">File Complaint</p>
            <p className="text-gray-500 text-xs mt-1">Report issues anonymously</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color = "bg-gray-50 text-gray-700 border-gray-200" 
}: { 
  label: string; 
  value: number;
  color?: string;
}) {
  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}