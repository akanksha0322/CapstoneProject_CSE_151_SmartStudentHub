"use client";

import { useState } from "react";
import { User, Phone, Calendar, MapPin, BookOpen, Upload, Save } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function StudentProfilePage() {
  const [form, setForm] = useState({
    phone: "",
    dob: "",
    gender: "",
    blood_group: "",
    address: "",
    current_year: "",
    semester: "",
    photo_url: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadPhoto = async () => {
    if (!photo) {
      alert("Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("photo", photo);

    setUploading(true);

    try {
      const res = await fetch(`${API}/students/profile/photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Upload failed");
        return;
      }

      setForm((prev) => ({
        ...prev,
        photo_url: data.photo_url,
      }));
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!form.photo_url) {
      alert("Please upload a profile photo first");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API}/students/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to save profile");
        return;
      }

      window.location.href = "/dashboard/student";
    } catch (error) {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Fill in your details to complete your student profile
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {form.photo_url ? (
                <img
                  src={`${API}${form.photo_url}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Upload className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {photo ? photo.name : "Choose Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </label>

              <button
                onClick={uploadPhoto}
                disabled={!photo || uploading}
                className={`px-5 py-2.5 rounded-lg font-medium transition ${
                  !photo || uploading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-800 text-white hover:bg-gray-900"
                }`}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                ) : (
                  "Upload Photo"
                )}
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  Phone Number
                </div>
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Date of Birth
                </div>
              </label>
              <input
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>
              <input
                name="blood_group"
                placeholder="e.g., O+"
                value={form.blood_group}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Current Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  Current Year
                </div>
              </label>
              <input
                name="current_year"
                type="number"
                placeholder="e.g., 3"
                min="1"
                max="5"
                value={form.current_year}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <input
                name="semester"
                type="number"
                placeholder="e.g., 6"
                min="1"
                max="10"
                value={form.semester}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Address (Full Width) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Address
              </div>
            </label>
            <textarea
              name="address"
              placeholder="Enter your complete address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={saveProfile}
              disabled={!form.photo_url || saving}
              className={`w-full py-3.5 rounded-lg font-medium text-lg transition flex items-center justify-center gap-3 ${
                !form.photo_url || saving
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
              }`}
            >
              {saving ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save & Continue to Dashboard
                </>
              )}
            </button>
            
            {!form.photo_url && (
              <p className="text-sm text-red-600 text-center mt-3">
                Please upload a profile photo to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}