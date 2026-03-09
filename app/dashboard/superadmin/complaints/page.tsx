"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import DashboardShell from "@/components/DashboardShell";
import { Search, Filter, Calendar, Eye, CheckCircle, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "in_review" | "resolved" | "closed";
  remarks?: string | null;
  created_at: string;
}

export default function SuperAdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (search) params.append("search", search);

    try {
      const res = await fetch(
        `${API}/superadmin/complaints?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setComplaints(data);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [status, category]);

  const updateStatus = async (
    id: string,
    newStatus: Complaint["status"]
  ) => {
    const remarks =
      newStatus !== "open"
        ? prompt("Remarks (optional, visible to student):")
        : null;

    try {
      await fetch(`${API}/superadmin/complaints/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          remarks,
        }),
      });

      fetchComplaints();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-red-100 text-red-700";
      case "in_review":
        return "bg-amber-100 text-amber-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "faculty":
        return "bg-blue-100 text-blue-700";
      case "infrastructure":
        return "bg-purple-100 text-purple-700";
      case "administration":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Protected role="super_admin">
      <DashboardShell title="Student Complaints">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                placeholder="Search title or description…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchComplaints()}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <select
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="faculty">Faculty</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="administration">Administration</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={fetchComplaints}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Filter className="h-4 w-4" />
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-600">
                {status || category || search 
                  ? "Try adjusting your filters to find what you're looking for."
                  : "There are no complaints to display at the moment."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {complaints.map((c) => (
                <div key={c._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Complaint Details */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {c.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {c.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(c.status)}`}>
                            {c.status.replace("_", " ")}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(c.category)}`}>
                            {c.category}
                          </span>
                        </div>
                      </div>

                      {/* Remarks */}
                      {c.remarks && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Remarks: </span>
                            {c.remarks}
                          </p>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                        <Calendar className="h-4 w-4" />
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      {c.status !== "in_review" && (
                        <button
                          onClick={() => updateStatus(c._id, "in_review")}
                          className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Mark as Review
                        </button>
                      )}

                      {c.status !== "resolved" && (
                        <button
                          onClick={() => updateStatus(c._id, "resolved")}
                          className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Resolved
                        </button>
                      )}

                      {c.status !== "closed" && (
                        <button
                          onClick={() => updateStatus(c._id, "closed")}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Mark as Closed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {complaints.length > 0 && !loading && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </div>
        )}
      </DashboardShell>
    </Protected>
  );
}