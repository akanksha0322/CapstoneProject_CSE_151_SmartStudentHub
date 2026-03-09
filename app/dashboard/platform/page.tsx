"use client";

import Protected from "@/components/Protected";

import Link from "next/link";

export default function PlatformDashboard() {
  return (
    <Protected role="platform_admin">
      
        <p className="text-black mb-8">
          Manage universities, super admins, and platform governance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Super Admins */}
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="font-bold text-black mb-2">
              University Admins
            </h3>
            <p className="text-sm text-black mb-4">
              Create, verify, disable, and manage university administrators.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard/platform/super-admins">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded">
                  View
                </button>
              </Link>

            </div>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="font-bold text-black mb-2">
              University Verification
            </h3>
            <p className="text-sm text-black mb-4">
              Review and approve university verification requests.
            </p>
            <Link href="/dashboard/platform/super-admins/verify">
              <button className="bg-yellow-600 text-white px-4 py-2 rounded">
                Review Requests
              </button>
            </Link>
          </div>

          {/* Platform Admins */}
          <div className="bg-white p-6 shadow rounded-xl">
            <h3 className="font-bold text-black mb-2">
              Platform Admins
            </h3>
            <p className="text-sm text-black mb-4">
              Manage platform-level administrators and access.
            </p>
            <Link href="/dashboard/platform/admins">
              <button className="bg-gray-800 text-white px-4 py-2 rounded">
                Manage Admins
              </button>
            </Link>
          </div>

        </div>
      
    </Protected>
  );
}
