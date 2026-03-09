"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Admin {
  _id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at?: string;
}

export default function UniversityAdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  /* =========================
     FETCH ADMINS
     ========================= */

  const fetchAdmins = async () => {
    const res = await fetch(`${API}/superadmin/admins`, {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Failed to fetch admins");
      return;
    }

    const data = await res.json();
    setAdmins(data);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  /* =========================
     CREATE ADMIN
     ========================= */

  const createAdmin = async () => {
    if (!form.name || !form.email) {
      alert("Name and email are required");
      return;
    }

    setLoading(true);

    const res = await fetch(`${API}/superadmin/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        email: form.email,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Failed to create admin");
      return;
    }

    setForm({ name: "", email: "" });
    fetchAdmins();
  };

  /* =========================
     TOGGLE STATUS
     ========================= */

  const toggleStatus = async (id: string, status: boolean) => {
    if (!confirm(`Are you sure you want to ${status ? "enable" : "disable"} this admin?`)) return;
    
    setActionLoading(id);
    await fetch(
      `${API}/superadmin/admins/${id}/status?is_active=${status}`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );
    setActionLoading(null);
    fetchAdmins();
  };

  /* =========================
     RESET PASSWORD
     ========================= */

  const resetPassword = async (id: string) => {
    if (!confirm("Send password reset email to this admin?")) return;

    setActionLoading(id + '-reset');
    await fetch(
      `${API}/superadmin/admins/${id}/reset-password`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    setActionLoading(null);
    alert("Password reset email sent");
  };

  /* =========================
     UI
     ========================= */

  return (
    <Protected role="super_admin">
      <div className="space-y-6 p-4 md:p-6 bg-white min-h-screen">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            University Admin Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage university administrators
          </p>
        </div>

        {/* ================= CREATE ADMIN ================= */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
          <h2 className="font-medium text-gray-900 mb-4 text-lg">
            Create University Admin
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Full Name</label>
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border border-gray-300 bg-white px-3 py-2 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border border-gray-300 bg-white px-3 py-2 rounded-lg text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={createAdmin}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>
        </div>

        {/* ================= ADMIN TABLE ================= */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-gray-700 font-medium">Name</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Email</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Status</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((a) => (
                  <tr key={a._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-900">{a.name}</td>
                    <td className="p-3 text-gray-900">{a.email}</td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          a.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleStatus(a._id, !a.is_active)}
                          disabled={actionLoading === a._id}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                            a.is_active 
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {actionLoading === a._id ? "Processing..." : a.is_active ? "Disable" : "Enable"}
                        </button>

                        <button
                          onClick={() => resetPassword(a._id)}
                          disabled={actionLoading === a._id + '-reset'}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === a._id + '-reset' ? "Sending..." : "Reset Password"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {admins.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-gray-500"
                    >
                      No university admins found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Protected>
  );
}