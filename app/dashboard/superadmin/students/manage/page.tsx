"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/students?${query}`,
      { credentials: "include" }
    );

    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [filters]);

  const resetPassword = async (id: string) => {
    if (!confirm("Send password reset email to this student?")) return;
    
    setActionLoading(id + '-reset');
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/reset-password`,
      { method: "POST", credentials: "include" }
    );
    setActionLoading(null);
    alert("Password reset email sent");
  };

  const toggleStatus = async (id: string, is_active: boolean) => {
    if (!confirm(`Are you sure you want to ${is_active ? "disable" : "enable"} this student?`)) return;
    
    setActionLoading(id + '-status');
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/status?is_active=${!is_active}`,
      { method: "PATCH", credentials: "include" }
    );
    setActionLoading(null);
    loadStudents();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white min-h-screen">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Manage Students
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          View, filter, and manage student accounts
        </p>
      </div>

      {/* 🔍 Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
        <h2 className="font-medium text-gray-900 mb-4">Filter Students</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Search</label>
            <input
              placeholder="Name or email"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Department</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm"
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
            >
              <option value="">All departments</option>
              <option value="Electronics">Electronics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Batch Year</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm"
              onChange={(e) =>
                setFilters({ ...filters, batch_year: e.target.value })
              }
            >
              <option value="">All batches</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm"
              onChange={(e) =>
                setFilters({ ...filters, is_active: e.target.value })
              }
            >
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📋 Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">Loading students...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-gray-700 font-medium">Name</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Email</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Register No</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Department</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Status</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-900">{s.name}</td>
                    <td className="p-3 text-gray-900">{s.email}</td>
                    <td className="p-3 text-gray-900">{s.register_no}</td>
                    <td className="p-3 text-gray-900">{s.academic?.department}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          s.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/dashboard/superadmin/students/manage/${s._id}`}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition"
                        >
                          View
                        </Link>

                        <button
                          onClick={() => resetPassword(s._id)}
                          disabled={actionLoading === s._id + '-reset'}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === s._id + '-reset' ? "Sending..." : "Reset"}
                        </button>

                        <button
                          onClick={() => toggleStatus(s._id, s.is_active)}
                          disabled={actionLoading === s._id + '-status'}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                            s.is_active 
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {actionLoading === s._id + '-status' ? "Processing..." : s.is_active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No students found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}