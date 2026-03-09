"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Project {
  project_id: string;
  student_id: string;
  student_name: string;
  register_no: string;
  title: string;
  github_url: string;
  deployment_url?: string;
  submitted_at: string;
}

export default function FacultyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const fetchProjects = async () => {
    const res = await fetch(
      `${API}/faculty/projects/pending`,
      { credentials: "include" }
    );

    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const approve = async (id: string) => {
    if (!confirm("Approve this project?")) return;
    
    setActiveAction(id);
    await fetch(
      `${API}/faculty/projects/${id}/approve`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    setActiveAction(null);
    fetchProjects();
  };

  const reject = async (id: string) => {
    const remarks = prompt("Reason for rejection?");
    if (!remarks) return;

    setActiveAction(id);
    await fetch(
      `${API}/faculty/projects/${id}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remarks }),
      }
    );
    setActiveAction(null);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading project submissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Project Submissions
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          Review and verify student project submissions
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
          <p className="text-gray-500">No pending project submissions</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {projects.map((project) => (
            <div 
              key={project.project_id} 
              className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm"
            >
              <div className="space-y-3">
                {/* Student Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">STUDENT</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{project.student_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">REGISTER NO</p>
                    <p className="text-sm font-semibold text-gray-900">{project.register_no}</p>
                  </div>
                </div>

                {/* Project Title */}
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">PROJECT TITLE</p>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{project.title}</p>
                </div>

                {/* Links */}
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">LINKS</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium hover:bg-gray-200 transition"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      GitHub
                    </a>
                    
                    {project.deployment_url && (
                      <a
                        href={project.deployment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 transition"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" />
                        </svg>
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* Submitted Date */}
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">SUBMITTED</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.submitted_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 mt-2">
                  <div className="flex flex-col xs:flex-row gap-2">
                    <button
                      disabled={activeAction === project.project_id}
                      onClick={() => approve(project.project_id)}
                      className="flex-1 px-3 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 active:bg-green-300 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {activeAction === project.project_id ? (
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
                      disabled={activeAction === project.project_id}
                      onClick={() => reject(project.project_id)}
                      className="flex-1 px-3 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 active:bg-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {activeAction === project.project_id ? (
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