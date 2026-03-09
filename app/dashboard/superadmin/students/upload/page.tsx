"use client";

import { useState } from "react";
import Protected from "@/components/Protected";

export default function StudentUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a .xlsx file");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_URL}/students/upload`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setMessage(
        `Upload successful — ${data.created} created, ${data.updated} updated`
      );
      setFile(null);

      // Clear file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected role="super_admin">
      <div className="space-y-6 p-4 md:p-6 bg-white min-h-screen">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Upload Students
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Upload student data from an Excel file
          </p>
        </div>

        {/* File Format Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-medium text-blue-900 mb-2">File Format Requirements</h2>
          <p className="text-blue-800 text-sm mb-3">
            Excel file must have exactly these column headers (case-sensitive):
          </p>
          <div className="bg-white rounded border border-blue-100 p-3 mb-3 overflow-x-auto">
            <code className="text-blue-700 text-sm whitespace-nowrap">
              name, email, register_no, department, program, batch_year, admission_year, admission_type
            </code>
          </div>
          <ul className="text-blue-800 text-sm space-y-1">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>File must be in .xlsx or .xls format</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Do not modify the column headers</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Remove any empty rows before uploading</span>
            </li>
          </ul>
        </div>

        {/* Upload Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
          <h2 className="font-medium text-gray-900 mb-4 text-lg">
            Upload Student Excel File
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setMessage("");
                }}
                disabled={loading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4 
                  file:rounded file:border-0 
                  file:text-sm file:font-medium 
                  file:bg-blue-50 file:text-blue-700 
                  hover:file:bg-blue-100
                  disabled:opacity-50"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload Students"}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {message}
            </div>
          )}
        </div>

        {/* Sample Data Table */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Sample Data Format</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left font-medium text-gray-700">name</th>
                    <th className="p-2 text-left font-medium text-gray-700">email</th>
                    <th className="p-2 text-left font-medium text-gray-700">register_no</th>
                    <th className="p-2 text-left font-medium text-gray-700">department</th>
                    <th className="p-2 text-left font-medium text-gray-700">program</th>
                    <th className="p-2 text-left font-medium text-gray-700">batch_year</th>
                    <th className="p-2 text-left font-medium text-gray-700">admission_year</th>
                    <th className="p-2 text-left font-medium text-gray-700">admission_type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="p-2 text-gray-700">John Doe</td>
                    <td className="p-2 text-gray-700">john.doe@university.edu</td>
                    <td className="p-2 text-gray-700">S001</td>
                    <td className="p-2 text-gray-700">Computer Science</td>
                    <td className="p-2 text-gray-700">B.Tech</td>
                    <td className="p-2 text-gray-700">2024</td>
                    <td className="p-2 text-gray-700">2020</td>
                    <td className="p-2 text-gray-700">Regular</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-2 text-gray-700">Jane Smith</td>
                    <td className="p-2 text-gray-700">jane.smith@university.edu</td>
                    <td className="p-2 text-gray-700">S002</td>
                    <td className="p-2 text-gray-700">Electronics</td>
                    <td className="p-2 text-gray-700">B.Tech</td>
                    <td className="p-2 text-gray-700">2023</td>
                    <td className="p-2 text-gray-700">2019</td>
                    <td className="p-2 text-gray-700">Regular</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: This is just an example. Your data should follow the same column structure.
          </p>
        </div>
      </div>
    </Protected>
  );
}