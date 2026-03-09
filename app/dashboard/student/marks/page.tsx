"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Mark {
  semester: number;
  subject: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
}

export default function StudentMarksPage() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/students/marks`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMarks(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Calculate statistics
  const totalSubjects = marks.length;
  const averagePercentage = marks.length > 0 
    ? (marks.reduce((sum, mark) => sum + (mark.marks_obtained / mark.total_marks) * 100, 0) / marks.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          My Marks
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          View your academic performance across all semesters
        </p>
      </div>

      {/* Stats */}
      {marks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">Total Subjects</p>
            <p className="text-2xl font-semibold text-blue-900">{totalSubjects}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Average Percentage</p>
            <p className="text-2xl font-semibold text-green-900">{averagePercentage}%</p>
          </div>
        </div>
      )}

      {/* Marks Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">Loading marks...</p>
        </div>
      ) : marks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500">No marks uploaded yet</p>
          <p className="text-gray-400 text-sm mt-1">Your marks will appear here once uploaded by faculty</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-gray-700 font-medium">Semester</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Subject</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Exam Type</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Marks Obtained</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Total Marks</th>
                  <th className="p-3 text-left text-gray-700 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m, idx) => {
                  const percentage = ((m.marks_obtained / m.total_marks) * 100).toFixed(1);
                  const isPass = m.marks_obtained >= (m.total_marks * 0.4); // Assuming 40% passing
                  
                  return (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-900">Semester {m.semester}</td>
                      <td className="p-3 text-gray-900">{m.subject}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          m.exam_type === 'Final' ? 'bg-purple-100 text-purple-700' :
                          m.exam_type === 'Midterm' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {m.exam_type}
                        </span>
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{m.marks_obtained}</td>
                      <td className="p-3 text-gray-900">{m.total_marks}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            parseFloat(percentage) >= 80 ? 'text-green-700' :
                            parseFloat(percentage) >= 60 ? 'text-blue-700' :
                            parseFloat(percentage) >= 40 ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {percentage}%
                          </span>
                          {!isPass && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              Fail
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {marks.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-2">Legend:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100"></div>
              <span className="text-gray-600">80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-100"></div>
              <span className="text-gray-600">60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
              <span className="text-gray-600">40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-100"></div>
              <span className="text-gray-600">Below 40%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}