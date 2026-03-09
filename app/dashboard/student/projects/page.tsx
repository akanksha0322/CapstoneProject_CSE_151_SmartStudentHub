"use client";

import { useEffect, useState } from "react";
import { Plus, Github, Link, User, Search, Clock, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Faculty {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  title: string;
  status: string;
  submitted_at?: string;
}

export default function StudentProjectsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [deployUrl, setDeployUrl] = useState("");

  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH DATA
     ========================= */

  const fetchFaculty = async () => {
    try {
      const res = await fetch(`${API}/faculty/list`, {
        credentials: "include",
      });
      const data = await res.json();
      setFaculty(data);
    } catch (error) {
      console.error("Failed to fetch faculty:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/students/projects`, {
        credentials: "include",
      });
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchProjects();
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
     SUBMIT PROJECT
     ========================= */

  const submitProject = async () => {
    if (!title.trim() || !description.trim() || !githubUrl.trim() || selectedFaculty.length === 0) {
      alert("Please fill all required fields and select at least one faculty");
      return;
    }

    setLoading(true);

    try {
      await fetch(`${API}/students/projects/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          github_url: githubUrl,
          deployment_url: deployUrl || null,
          assigned_faculty_ids: selectedFaculty,
        }),
      });

      // Reset form
      setTitle("");
      setDescription("");
      setGithubUrl("");
      setDeployUrl("");
      setSelectedFaculty([]);
      setFacultySearch("");
      
      fetchProjects();
    } catch (error) {
      console.error("Failed to submit project:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Project Submission
          </h1>
          <p className="text-gray-600">
            Submit your projects and track their status
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Submit Form */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Submit New Project
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter project title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[120px] resize-none"
                    placeholder="Describe your project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub Repository URL
                    </div>
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="https://github.com/username/project"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>

                {/* Deployment URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Deployment URL (Optional)
                    </div>
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="https://your-project.vercel.app"
                    value={deployUrl}
                    onChange={(e) => setDeployUrl(e.target.value)}
                  />
                </div>

                {/* Faculty Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assign to Faculty
                    </div>
                  </label>

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search faculty by name or email..."
                      value={facultySearch}
                      onChange={(e) => setFacultySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                    />
                  </div>

                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {filteredFaculty.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No faculty found
                      </p>
                    ) : (
                      filteredFaculty.map((f) => (
                        <label
                          key={f._id}
                          className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFaculty.includes(f._id)}
                            onChange={() => toggleFaculty(f._id)}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{f.name}</div>
                            <div className="text-xs text-gray-500">{f.email}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {selectedFaculty.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      Selected: {selectedFaculty.length} faculty member{selectedFaculty.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitProject}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-lg font-medium transition ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white flex items-center justify-center gap-3`}
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Submit Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Projects List */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                My Projects ({projects.length})
              </h2>

              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    You haven't submitted any projects yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project._id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {project.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      
                      {project.submitted_at && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          Submitted on {new Date(project.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}