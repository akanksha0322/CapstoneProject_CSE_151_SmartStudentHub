"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface UploadResponse {
  message: string;
  processed: number;
  failed: number;
  errors: string[];
}

export default function FacultyMarksUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResponse(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setResponse({
        message: "Error: No file selected",
        processed: 0,
        failed: 0,
        errors: ["Please select a file to upload"]
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResponse(null);

    try {
      // CORRECTED API ENDPOINT
      const res = await fetch(`${API}/faculty/marks/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data: UploadResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setResponse(data);
      setFile(null);
      
      // Clear file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
    } catch (err: any) {
      setResponse({
        message: "Upload failed",
        processed: 0,
        failed: 0,
        errors: [err.message || "Unknown error occurred"]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0 bg-white">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Upload Student Marks
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          Upload marks from an Excel file with the required format
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <h2 className="font-medium text-blue-900 text-sm sm:text-base mb-2">
          File Format Requirements
        </h2>
        <p className="text-blue-800 text-xs sm:text-sm mb-2">
          Excel file must have these column headers (case-sensitive):
        </p>
        <div className="bg-white rounded border border-blue-100 p-2 sm:p-3 mb-2 overflow-x-auto">
          <code className="text-blue-700 text-xs sm:text-sm whitespace-nowrap">
            register_no, semester, exam_type, subject, marks, total
          </code>
        </div>
        <ul className="text-blue-800 text-xs sm:text-sm space-y-1">
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
            <span>Ensure data types are correct (numbers for marks/total)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Remove any empty rows before uploading</span>
          </li>
        </ul>
      </div>

      {/* Upload Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4 
                file:rounded file:border-0 
                file:text-sm file:font-medium 
                file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100"
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
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Upload Marks"}
          </button>
        </form>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`rounded-xl border p-4 md:p-6 ${
          response.failed > 0 || response.errors.length > 0 
            ? "bg-red-50 border-red-200" 
            : "bg-green-50 border-green-200"
        }`}>
          <h3 className="font-medium text-gray-900 text-lg mb-4">
            {response.failed > 0 || response.errors.length > 0 ? "Upload Results" : "Upload Successful"}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Processed: <span className="font-medium">{response.processed}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Failed: <span className="font-medium">{response.failed}</span></span>
              </div>
            </div>

            <div>
              <div className="font-medium text-gray-700 mb-1">Message:</div>
              <div className={`p-3 rounded-lg bg-white border text-sm ${
                response.failed > 0 ? "border-red-100" : "border-green-100"
              }`}>
                {response.message}
              </div>
            </div>

            {response.errors && response.errors.length > 0 && (
              <div>
                <div className="font-medium text-red-700 mb-2">Errors:</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {response.errors.map((error, index) => (
                    <div key={index} className="p-3 rounded-lg bg-red-100 text-red-800 border border-red-200 text-sm">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample Data Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Sample Data Format</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-700">register_no</th>
                  <th className="p-3 text-left font-medium text-gray-700">semester</th>
                  <th className="p-3 text-left font-medium text-gray-700">exam_type</th>
                  <th className="p-3 text-left font-medium text-gray-700">subject</th>
                  <th className="p-3 text-left font-medium text-gray-700">marks</th>
                  <th className="p-3 text-left font-medium text-gray-700">total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">S001</td>
                  <td className="p-3 text-gray-700">5</td>
                  <td className="p-3 text-gray-700">Internal</td>
                  <td className="p-3 text-gray-700">Computer Science</td>
                  <td className="p-3 text-gray-700">85</td>
                  <td className="p-3 text-gray-700">100</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="p-3 text-gray-700">S002</td>
                  <td className="p-3 text-gray-700">5</td>
                  <td className="p-3 text-gray-700">Internal</td>
                  <td className="p-3 text-gray-700">Mathematics</td>
                  <td className="p-3 text-gray-700">78</td>
                  <td className="p-3 text-gray-700">100</td>
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
  );
}