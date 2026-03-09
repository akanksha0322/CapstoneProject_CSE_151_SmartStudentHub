"use client";

import Protected from "@/components/Protected";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";

export default function SuperAdminDashboard() {
  return (
    <Protected role="super_admin">
      <DashboardShell title="Super Admin Dashboard">
        <p className="text-gray-600 mb-8">
          Manage university users, academic operations, and grievances.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* University Admins */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              University Admins
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create & manage institution owners
            </p>
            <Link href="/dashboard/superadmin/admins">
              <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                Manage Admins
              </button>
            </Link>
          </div>

          {/* Faculty */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Faculty
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Assign and manage academic staff
            </p>
            <Link href="/dashboard/superadmin/faculty">
              <button className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                Manage Faculty
              </button>
            </Link>
          </div>

          {/* Students */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Students
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload, view, and edit student records
            </p>
            <div className="space-y-3">
              <Link href="/dashboard/superadmin/students/upload">
                <button className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                  Upload Students
                </button>
              </Link>
              <Link href="/dashboard/superadmin/students/manage">
                <button className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                  Manage / Edit Students
                </button>
              </Link>
            </div>
          </div>

          {/* Complaints / Grievance */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-3">
            <h3 className="font-semibold text-gray-900 mb-2">
              Student Complaints
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View and manage anonymous student grievances
            </p>
            <Link href="/dashboard/superadmin/complaints">
              <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                View Complaints
              </button>
            </Link>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}