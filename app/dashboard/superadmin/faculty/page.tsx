"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Faculty {
  _id: string;
  name: string;
  email: string;
  is_active: boolean;
  academic: {
    department: string;
    designation: string;
  };
  permissions: {
    can_verify_certificates: boolean;
    can_verify_projects: boolean;
    can_verify_internships: boolean;
  };
}

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFaculty = async () => {
    const res = await fetch(`${API}/superadmin/faculty`, {
      credentials: "include",
    });
    const data = await res.json();
    setFaculty(data);
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // 📤 Upload Excel
  const uploadExcel = async () => {
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch(`${API}/superadmin/faculty/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Upload failed. Please check the file format.");
        return;
      }

      setFile(null);
      fetchFaculty();
      alert("Faculty uploaded successfully!");
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Activate / Deactivate
  const toggleStatus = async (id: string, status: boolean) => {
    if (!confirm(`Are you sure you want to ${status ? "enable" : "disable"} this faculty member?`)) return;
    
    setActionLoading(id + '-status');
    await fetch(`${API}/superadmin/faculty/${id}/status?is_active=${status}`, {
      method: "PATCH",
      credentials: "include",
    });
    setActionLoading(null);
    fetchFaculty();
  };

  // 🔐 Reset Password
  const resetPassword = async (id: string) => {
    if (!confirm("Send password reset email to faculty?")) return;

    setActionLoading(id + '-reset');
    await fetch(`${API}/superadmin/faculty/${id}/reset-password`, {
      method: "POST",
      credentials: "include",
    });
    setActionLoading(null);
    alert("Password reset email sent");
  };

  // 🛂 Update Permissions
  const updatePermissions = async (
    id: string,
    permissions: Faculty["permissions"]
  ) => {
    setSavingId(id);

    await fetch(`${API}/superadmin/faculty/${id}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(permissions),
    });

    setSavingId(null);
    fetchFaculty();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white min-h-screen">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Faculty Management
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage faculty members and their permissions
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-medium text-blue-900 mb-2">File Format Requirements</h2>
          <p className="text-blue-800 text-sm mb-3">
            Excel file must have exactly these column headers (case-sensitive):
          </p>
          <div className="bg-white rounded border border-blue-100 p-3 mb-3 overflow-x-auto">
            <code className="text-blue-700 text-sm whitespace-nowrap">
              name, email, employee_id, department, designation, employment_type, joining_year, can_verify_certificates, can_verify_projects, can_verify_internships
            </code>
          </div>
          <ul className="text-blue-800 text-sm space-y-1">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>File must be in .xlsx or .xls format</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Boolean columns (can_verify_*) should contain TRUE/FALSE or 1/0</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Remove any empty rows before uploading</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
          <h2 className="font-medium text-gray-900 mb-4 text-lg">
            Upload Faculty (Excel)
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <button
              onClick={uploadExcel}
              disabled={loading || !file}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed md:w-auto w-full"
            >
              {loading ? "Uploading..." : "Upload Faculty"}
            </button>
          </div>
        </div>
      </div>

      {/* Sample Data Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Sample Data Format</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left font-medium text-gray-700">name</th>
                  <th className="p-2 text-left font-medium text-gray-700">email</th>
                  <th className="p-2 text-left font-medium text-gray-700">employee_id</th>
                  <th className="p-2 text-left font-medium text-gray-700">department</th>
                  <th className="p-2 text-left font-medium text-gray-700">designation</th>
                  <th className="p-2 text-left font-medium text-gray-700">employment_type</th>
                  <th className="p-2 text-left font-medium text-gray-700">joining_year</th>
                  <th className="p-2 text-left font-medium text-gray-700">can_verify_certificates</th>
                  <th className="p-2 text-left font-medium text-gray-700">can_verify_projects</th>
                  <th className="p-2 text-left font-medium text-gray-700">can_verify_internships</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="p-2 text-gray-700">John Doe</td>
                  <td className="p-2 text-gray-700">john.doe@university.edu</td>
                  <td className="p-2 text-gray-700">EMP001</td>
                  <td className="p-2 text-gray-700">Computer Science</td>
                  <td className="p-2 text-gray-700">Professor</td>
                  <td className="p-2 text-gray-700">Full-time</td>
                  <td className="p-2 text-gray-700">2015</td>
                  <td className="p-2 text-gray-700">TRUE</td>
                  <td className="p-2 text-gray-700">TRUE</td>
                  <td className="p-2 text-gray-700">TRUE</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="p-2 text-gray-700">Jane Smith</td>
                  <td className="p-2 text-gray-700">jane.smith@university.edu</td>
                  <td className="p-2 text-gray-700">EMP002</td>
                  <td className="p-2 text-gray-700">Mathematics</td>
                  <td className="p-2 text-gray-700">Assistant Professor</td>
                  <td className="p-2 text-gray-700">Full-time</td>
                  <td className="p-2 text-gray-700">2018</td>
                  <td className="p-2 text-gray-700">TRUE</td>
                  <td className="p-2 text-gray-700">FALSE</td>
                  <td className="p-2 text-gray-700">TRUE</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Note: This is just an example. Your data should follow the same column structure.
        </p>
      </div>

      {/* Faculty Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-gray-700 font-medium">Name</th>
                <th className="p-3 text-left text-gray-700 font-medium">Email</th>
                <th className="p-3 text-left text-gray-700 font-medium">Department</th>
                <th className="p-3 text-left text-gray-700 font-medium">Permissions</th>
                <th className="p-3 text-left text-gray-700 font-medium">Status</th>
                <th className="p-3 text-left text-gray-700 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {faculty.map((f) => (
                <tr key={f._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{f.name}</td>
                  <td className="p-3 text-gray-900">{f.email}</td>
                  <td className="p-3 text-gray-900">{f.academic.department}</td>

                  {/* Permissions */}
                  <td className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={f.permissions.can_verify_certificates}
                          onChange={(e) =>
                            updatePermissions(f._id, {
                              ...f.permissions,
                              can_verify_certificates: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-700">Certificates</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={f.permissions.can_verify_projects}
                          onChange={(e) =>
                            updatePermissions(f._id, {
                              ...f.permissions,
                              can_verify_projects: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-700">Projects</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={f.permissions.can_verify_internships}
                          onChange={(e) =>
                            updatePermissions(f._id, {
                              ...f.permissions,
                              can_verify_internships: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-700">Internships</span>
                      </div>

                      {savingId === f._id && (
                        <span className="text-blue-600 text-xs">
                          Saving permissions...
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        f.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {f.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleStatus(f._id, !f.is_active)}
                        disabled={actionLoading === f._id + '-status'}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                          f.is_active 
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {actionLoading === f._id + '-status' ? "Processing..." : f.is_active ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => resetPassword(f._id)}
                        disabled={actionLoading === f._id + '-reset'}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === f._id + '-reset' ? "Sending..." : "Reset Password"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {faculty.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No faculty members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}