"use client";

import { useEffect, useState } from "react";

type SuperAdmin = {
  _id: string;
  name: string;
  email: string;
  is_active: boolean;
  verification?: {
    status?: string;
  };
  university?: {
    name?: string;
  };
};

export default function SuperAdminsList() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (name) params.append("name", name);
    if (email) params.append("email", email);
    if (university) params.append("university", university);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins?${params.toString()}`,
      { credentials: "include" }
    );

    const data = await res.json();
    setAdmins(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, [status]);

  const toggleStatus = async (id: string, active: boolean) => {
    if (!confirm(`Are you sure you want to ${active ? "enable" : "disable"} this account?`))
      return;

    setActionLoading(id);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins/${id}/status?is_active=${active}`,
      { method: "PATCH", credentials: "include" }
    );
    await fetchAdmins();
    setActionLoading(null);
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm("This will permanently disable this super admin. Continue?"))
      return;

    setActionLoading(id);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins/${id}`,
      { method: "DELETE", credentials: "include" }
    );
    setAdmins(prev => prev.filter(a => a._id !== id));
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 bg-white">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          University Admins (Super Admins)
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage university administrators and their verification status
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <input
            placeholder="Search name"
            className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm text-gray-900"
            onChange={e => setName(e.target.value)}
          />

          <input
            placeholder="Search email"
            className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm text-gray-900"
            onChange={e => setEmail(e.target.value)}
          />

          <input
            placeholder="Search university"
            className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm text-gray-900"
            onChange={e => setUniversity(e.target.value)}
          />

          <select
            className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm text-gray-900"
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={fetchAdmins}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Apply Filters
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-gray-700 font-medium">Name</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Email</th>
                  <th className="p-3 text-left text-gray-700 font-medium">University</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Status</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Active</th>
                  <th className="p-3 text-right text-gray-700 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-900">{a.name}</td>
                    <td className="p-3 text-gray-900">{a.email}</td>
                    <td className="p-3 text-gray-900">{a.university?.name || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        a.verification?.status === 'approved' ? 'bg-green-100 text-green-800' :
                        a.verification?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        a.verification?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {a.verification?.status ? a.verification.status.charAt(0).toUpperCase() + a.verification.status.slice(1) : "-"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {a.is_active ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(a._id, !a.is_active)}
                          disabled={actionLoading === a._id}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                            a.is_active 
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {actionLoading === a._id ? 'Processing...' : a.is_active ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => deleteAdmin(a._id)}
                          disabled={actionLoading === a._id}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === a._id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {admins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No super admins found
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