"use client";

import { useEffect, useState } from "react";
import { Send, Clock, CheckCircle, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function StudentComplaintsPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("faculty");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    const res = await fetch(`${API}/students/complaints`, {
      credentials: "include",
    });
    setComplaints(await res.json());
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const submit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert("Please fill in both subject and description");
      return;
    }

    setSubmitting(true);
    try {
      await fetch(`${API}/students/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category, subject, description }),
      });

      setSubject("");
      setDescription("");
      fetchComplaints();
    } catch (error) {
      console.error("Failed to submit complaint:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8">
          My Complaints
        </h1>

        {/* Complaint Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Submit New Complaint
          </h2>

          <div className="space-y-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="faculty">Faculty</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="admin">Administration</option>
              <option value="other">Other</option>
            </select>

            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[120px] resize-none"
              placeholder="Describe the issue in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button
              onClick={submit}
              disabled={submitting}
              className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </div>

        {/* Complaints List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              My Complaints ({complaints.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No complaints submitted yet
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{c.subject}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {c.status}
                      </span>
                      {getStatusIcon(c.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-600">
                      Category: <span className="font-medium capitalize">{c.category}</span>
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{c.description}</p>

                  {c.remarks && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Admin Remarks</p>
                          <p className="text-gray-600">{c.remarks}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}