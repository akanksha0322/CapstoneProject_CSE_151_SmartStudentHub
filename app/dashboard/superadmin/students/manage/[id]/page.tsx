"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function StudentDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadStudent = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}`,
          { credentials: "include" }
        );

        const data = await res.json();
        setStudent(data);
      } catch (err) {
        console.error("Failed to load student", err);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  if (!id) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-red-600">Invalid student ID</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600">Loading student details...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-red-600">Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white min-h-screen">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          {student.name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Student Details
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-medium">EMAIL</p>
              <p className="text-gray-900">{student.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">REGISTER NUMBER</p>
              <p className="text-gray-900">{student.register_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">BATCH YEAR</p>
              <p className="text-gray-900">{student.academic?.batch_year || "Not set"}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-medium">DEPARTMENT</p>
              <p className="text-gray-900">{student.academic?.department || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">PROGRAM</p>
              <p className="text-gray-900">{student.academic?.program || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">STATUS</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                student.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {student.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}