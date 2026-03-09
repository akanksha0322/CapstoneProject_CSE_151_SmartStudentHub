"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Internship {
  _id: string;
  company: string;
  role: string;
  duration: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  file_id: string;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
}

export default function StudentInternshipsPage() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [duration, setDuration] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* =========================
     FETCH DATA
     ========================= */

  const fetchFaculty = async () => {
    const res = await fetch(`${API}/faculty/list`, {
      credentials: "include",
    });
    setFaculty(await res.json());
  };

  const fetchInternships = async () => {
    const res = await fetch(`${API}/students/certificates/internships`, {
      credentials: "include",
    });
    setInternships(await res.json());
  };

  useEffect(() => {
    fetchFaculty();
    fetchInternships();
  }, []);

  /* =========================
     FACULTY SEARCH + SELECT
     ========================= */

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.email.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const toggleFaculty = (id: string) => {
    setSelectedFaculty((prev) =>
      prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id]
    );
  };

  /* =========================
     UPLOAD INTERNSHIP
     ========================= */

  const uploadInternship = async () => {
    if (
      !company ||
      !role ||
      !duration ||
      !file ||
      selectedFaculty.length === 0
    ) {
      alert("Please fill all fields and select at least one faculty");
      return;
    }

    const formData = new FormData();
    formData.append("company", company);
    formData.append("role", role);
    formData.append("duration", duration);
    formData.append("file", file);

    selectedFaculty.forEach((fid) =>
      formData.append("assigned_faculty_ids", fid)
    );

    setUploading(true);

    await fetch(`${API}/students/certificates/internships/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    setUploading(false);
    setCompany("");
    setRole("");
    setDuration("");
    setFile(null);
    setSelectedFaculty([]);
    setFacultySearch("");

    fetchInternships();
  };

  /* =========================
     UI
     ========================= */

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Internship Documents
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Upload and track your internship offer letters
        </p>
      </div>

      {/* ================= Upload Section ================= */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 space-y-6">
        <h2 className="font-medium text-gray-900 text-lg">Upload Internship Offer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              placeholder="Enter company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role / Position</label>
            <input
              type="text"
              placeholder="Enter your role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <input
              type="text"
              placeholder="e.g. 3 months, 6 weeks"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Offer Letter (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4 
                file:rounded file:border-0 
                file:text-sm file:font-medium 
                file:bg-blue-50 file:text-gray-900 
                hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </div>

        {/* Faculty Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Faculty</label>
          
          <input
            type="text"
            placeholder="Search faculty by name or email"
            value={facultySearch}
            onChange={(e) => setFacultySearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 mb-3"
          />

          <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-3 space-y-2">
            {filteredFaculty.map((f) => (
              <label
                key={f._id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFaculty.includes(f._id)}
                  onChange={() => toggleFaculty(f._id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <div>
                  <p className="text-sm text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.email}</p>
                </div>
              </label>
            ))}

            {filteredFaculty.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No faculty found
              </p>
            )}
          </div>
          
          {selectedFaculty.length > 0 && (
            <p className="text-xs text-gray-600 mt-2">
              Selected {selectedFaculty.length} faculty member(s)
            </p>
          )}
        </div>

        <button
          onClick={uploadInternship}
          disabled={uploading}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Internship"}
        </button>
      </div>

      {/* ================= Internship List ================= */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-gray-700 font-medium">Company</th>
                <th className="p-3 text-left text-gray-700 font-medium">Role</th>
                <th className="p-3 text-left text-gray-700 font-medium">Duration</th>
                <th className="p-3 text-left text-gray-700 font-medium">Status</th>
                <th className="p-3 text-left text-gray-700 font-medium">Remarks</th>
                <th className="p-3 text-left text-gray-700 font-medium">Document</th>
              </tr>
            </thead>

            <tbody>
              {internships.map((i) => (
                <tr key={i._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{i.company}</td>
                  <td className="p-3 text-gray-900">{i.role}</td>
                  <td className="p-3 text-gray-900">{i.duration}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        i.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : i.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {i.status.charAt(0).toUpperCase() + i.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-900">{i.remarks || "-"}</td>
                  <td className="p-3">
                    <a
                      href={`${API}/files/${i.file_id}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      View PDF
                    </a>
                  </td>
                </tr>
              ))}

              {internships.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No internships uploaded yet
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