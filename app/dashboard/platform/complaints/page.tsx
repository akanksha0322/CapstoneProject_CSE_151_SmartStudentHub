"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Calendar, User, Mail } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  student: {
    name: string;
    email: string;
    register_no: string;
  };
}

export default function PlatformAdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (category) params.append("category", category);
      if (search) params.append("search", search);

      const res = await fetch(
        `${API}/platformadmin/complaints?${params.toString()}`,
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
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-amber-100 text-amber-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "faculty":
        return "text-purple-600 bg-purple-50";
      case "infrastructure":
        return "text-orange-600 bg-orange-50";
      case "exam":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Complaints Overview
          </h1>
          <p className="text-gray-600">
            Manage and review student complaints
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="">All Categories</option>
                <option value="faculty">Faculty</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="exam">Exam</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <button
              onClick={fetchComplaints}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading complaints...</p>
            </div>
          ) : complaints.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700">Title</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{c.student?.name}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <Mail className="h-3 w-3" />
                              {c.student?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(c.category)}`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{c.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {c.description}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(c.status)}`}>
                          {c.status.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(c.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {status || category || search 
                  ? "Try adjusting your filters to find what you're looking for."
                  : "There are no complaints to display at the moment."}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {complaints.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}