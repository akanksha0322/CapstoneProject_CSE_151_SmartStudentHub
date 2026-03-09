"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


type PlatformAdmin = {
  _id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at?: string;
};

export default function PlatformAdminsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔐 Role check
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          { credentials: "include" }
        );

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.role !== "platform_admin") {
          router.push("/unauthorized");
          return;
        }

        await fetchAdmins();
        setLoading(false);
      } catch {
        router.push("/login");
      }
    };

    init();
  }, [router]);

  const fetchAdmins = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/admins`,
      { credentials: "include" }
    );
    const data = await res.json();
    setAdmins(Array.isArray(data) ? data : []);
  };

  const createAdmin = async () => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/platform/admins`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create platform admin");
      }

      setSuccess("Platform admin created. Activation email sent.");
      setForm({ name: "", email: "" });
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleStatus = async (id: string, active: boolean) => {
    if (!confirm(`Are you sure you want to ${active ? "enable" : "disable"} this admin?`))
      return;

    setActionLoading(id);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/admins/${id}/status?is_active=${active}`,
      { method: "PATCH", credentials: "include" }
    );
    await fetchAdmins();
    setActionLoading(null);
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm("This will permanently disable this platform admin. Continue?"))
      return;

    setActionLoading(id);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/admins/${id}`,
      { method: "DELETE", credentials: "include" }
    );
    setAdmins(prev => prev.filter(a => a._id !== id));
    setActionLoading(null);
  };

  if (loading) {
    return <p className="p-6 text-black">Loading...</p>;
  }

  return (
    <div className="">

      {/* Create Admin */}
      <div className="bg-white p-6 rounded-xl shadow max-w-xl mb-8">
        <h2 className="text-lg font-semibold text-black mb-4">
          Add New Platform Admin
        </h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <div className="mb-3">
          <label className="block text-black mb-1">Full Name</label>
          <input
            className="border p-2 rounded w-full text-black"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="block text-black mb-1">Email</label>
          <input
            type="email"
            className="border p-2 rounded w-full text-black"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <button
          onClick={createAdmin}
          className="bg-indigo-600 text-white px-6 py-2 rounded"
        >
          Create Platform Admin
        </button>
      </div>

      {/* Admin List */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a._id} className="border-t">
                <td className="p-3 text-black">{a.name}</td>
                <td className="text-black">{a.email}</td>
                <td className="text-black">
                  {a.is_active ? "Enabled" : "Disabled"}
                </td>
                <td className="p-3 flex justify-end gap-2">
                  <button
                    onClick={() => toggleStatus(a._id, !a.is_active)}
                    disabled={actionLoading === a._id}
                    className={`px-3 py-1 text-xs rounded text-white ${
                      a.is_active ? "bg-orange-600" : "bg-green-600"
                    }`}
                  >
                    {a.is_active ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => deleteAdmin(a._id)}
                    disabled={actionLoading === a._id}
                    className="px-3 py-1 text-xs rounded bg-red-600 text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-black">
                  No platform admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
