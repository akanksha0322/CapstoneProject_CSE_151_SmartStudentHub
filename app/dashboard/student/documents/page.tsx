"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Trash2, Eye, FileText, Briefcase, Calendar, Download } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface DocumentItem {
  id: string;
  type: "certificate" | "internship";
  title: string;
  role?: string;
  status: string;
  file_id: string;
  submitted_at: string;
}

export default function StudentDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API}/students/certificates/documents?doc_type=${type}&search=${search}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setDocs(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [type]);

  const deleteDoc = async (doc: DocumentItem) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;

    try {
      await fetch(
        `${API}/students/documents/${doc.type}/${doc.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      fetchDocs();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Approved Documents
          </h1>
          <p className="text-gray-600">
            View and manage your approved certificates and internship documents
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDocs()}
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="text-gray-400 h-5 w-5" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="certificate">Certificates</option>
                <option value="internship">Internships</option>
              </select>

              <button
                onClick={fetchDocs}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none"
              >
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : docs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 md:p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left Section - Document Info */}
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        doc.type === "certificate" 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-green-100 text-green-600"
                      }`}>
                        {doc.type === "certificate" ? (
                          <FileText className="h-6 w-6" />
                        ) : (
                          <Briefcase className="h-6 w-6" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            doc.type === "certificate"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(doc.submitted_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {doc.title}
                        </h3>
                        
                        {doc.role && (
                          <p className="text-gray-600">
                            Role: <span className="font-medium">{doc.role}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                      <a
                        href={`${API}/files/${doc.file_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                      
                      <button
                        onClick={() => deleteDoc(doc)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {search || type !== "all" 
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "You don't have any approved documents yet."}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {docs.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {docs.length} document{docs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}