"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface InternshipApproval {
  internship_id: string;
  student_id: string;
  student_name: string;
  register_no: string;
  company: string;
  role: string;
  duration: string;
  file_id: string;
  submitted_at: string;
}

export default function FacultyInternshipApprovalsPage() {
  const [items, setItems] = useState<InternshipApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const fetchApprovals = async () => {
    const res = await fetch(`${API}/faculty/internships/pending`, {
      credentials: "include",
    });

    const data = await res.json();
    setItems(data);
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const approve = async (id: string) => {
    if (!confirm("Approve this internship?")) return;

    setActiveAction(id);
    setLoading(true);
    await fetch(`${API}/faculty/internships/${id}/approve`, {
      method: "POST",
      credentials: "include",
    });
    setLoading(false);
    setActiveAction(null);
    fetchApprovals();
  };

  const reject = async (id: string) => {
    const remarks = prompt("Reason for rejection?");
    if (!remarks) return;

    setActiveAction(id);
    setLoading(true);
    await fetch(`${API}/faculty/internships/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ remarks }),
    });
    setLoading(false);
    setActiveAction(null);
    fetchApprovals();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Internship Approvals
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          Review and verify student internship submissions
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
          <p className="text-gray-500">No pending internship approvals</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div 
              key={item.internship_id} 
              className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm"
            >
              <div className="space-y-3">
                {/* Student Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">STUDENT</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.student_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">REGISTER NO</p>
                    <p className="text-sm font-semibold text-gray-900">{item.register_no}</p>
                  </div>
                </div>

                {/* Company & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">COMPANY</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.company}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">ROLE</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.role}</p>
                  </div>
                </div>

                {/* Duration & Document */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">DURATION</p>
                    <p className="text-sm text-gray-900">{item.duration}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">DOCUMENT</p>
                    <a
                      href={`${API}/files/${item.file_id}`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium block truncate"
                    >
                      View PDF
                    </a>
                  </div>
                </div>

                {/* Submitted Date */}
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">SUBMITTED</p>
                  <p className="text-sm text-gray-900">
                    {new Date(item.submitted_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 mt-2">
                  <div className="flex flex-col xs:flex-row gap-2">
                    <button
                      disabled={loading && activeAction === item.internship_id}
                      onClick={() => approve(item.internship_id)}
                      className="flex-1 px-3 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 active:bg-green-300 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading && activeAction === item.internship_id ? (
                        <span className="flex items-center justify-center gap-1">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Processing
                        </span>
                      ) : "Approve"}
                    </button>
                    <button
                      disabled={loading && activeAction === item.internship_id}
                      onClick={() => reject(item.internship_id)}
                      className="flex-1 px-3 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 active:bg-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading && activeAction === item.internship_id ? (
                        <span className="flex items-center justify-center gap-1">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Processing
                        </span>
                      ) : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}