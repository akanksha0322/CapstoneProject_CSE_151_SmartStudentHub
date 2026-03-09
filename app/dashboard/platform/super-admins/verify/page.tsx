"use client";

import { useEffect, useState } from "react";

type SuperAdminRequest = {
  _id: string;
  name: string;
  email: string;
  university_name: string;
  university_type: string;
  aishe_code: string;
  ugc_or_aicte_id: string;
  official_email_domain: string;
  state: string;
  district: string;
  website?: string;
  contact_phone?: string;
  established_year?: number;
};

export default function VerifyUniversities() {
  const [requests, setRequests] = useState<SuperAdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins/requests`,
          { credentials: "include" }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch verification requests");
        }

        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const approve = async (id: string) => {
    if (!confirm("Approve this university and send activation email?")) return;

    setActionLoading(id);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins/requests/${id}/approve`,
        { method: "POST", credentials: "include" }
      );

      setRequests(prev => prev.filter(r => r._id !== id));
    } catch {
      alert("Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    if (!confirm("Reject this request?")) return;

    setActionLoading(id);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins/requests/${id}/reject`,
        { method: "POST", credentials: "include" }
      );

      setRequests(prev => prev.filter(r => r._id !== id));
    } catch {
      alert("Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">Loading verification requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          University Verification Requests
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Review and verify university registration requests
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No pending verification requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req._id}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              {/* Applicant Info */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 text-lg">{req.name}</h3>
                <p className="text-gray-600 text-sm">{req.email}</p>
              </div>

              {/* University Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-5">
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">UNIVERSITY</p>
                    <p className="text-gray-900">{req.university_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">TYPE</p>
                    <p className="text-gray-900">{req.university_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">AISHE CODE</p>
                    <p className="text-gray-900">{req.aishe_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">UGC / AICTE ID</p>
                    <p className="text-gray-900">{req.ugc_or_aicte_id}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">EMAIL DOMAIN</p>
                    <p className="text-gray-900">{req.official_email_domain}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">LOCATION</p>
                    <p className="text-gray-900">{req.district}, {req.state}</p>
                  </div>
                  {req.website && (
                    <div>
                      <p className="text-gray-500 text-xs font-medium">WEBSITE</p>
                      <p className="text-gray-900">{req.website}</p>
                    </div>
                  )}
                  {req.contact_phone && (
                    <div>
                      <p className="text-gray-500 text-xs font-medium">PHONE</p>
                      <p className="text-gray-900">{req.contact_phone}</p>
                    </div>
                  )}
                  {req.established_year && (
                    <div>
                      <p className="text-gray-500 text-xs font-medium">ESTABLISHED YEAR</p>
                      <p className="text-gray-900">{req.established_year}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => approve(req._id)}
                    disabled={actionLoading === req._id}
                    className="flex-1 px-4 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === req._id ? 'Processing...' : 'Approve & Send Email'}
                  </button>

                  <button
                    onClick={() => reject(req._id)}
                    disabled={actionLoading === req._id}
                    className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === req._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}