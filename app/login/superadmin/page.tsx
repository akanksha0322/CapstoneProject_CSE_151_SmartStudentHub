"use client";

import { useState } from "react";

export default function SuperAdminRequestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",

    university_name: "",
    university_type: "",
    aishe_code: "",
    ugc_or_aicte_id: "",
    official_email_domain: "",
    state: "",
    district: "",

    website: "",
    contact_phone: "",
    established_year: ""
  });

  const submitRequest = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            established_year: form.established_year
              ? Number(form.established_year)
              : null
          })
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Submission failed");
      }

      setSuccess(
        "Your request has been submitted successfully. Once approved, you will receive an email with instructions to activate your Super Admin account."
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center py-12 px-4">
      <div className="bg-white w-full max-w-3xl p-8 rounded-xl shadow">

        <h1 className="text-2xl font-semibold text-black mb-2">
          Super Admin Registration Request
        </h1>

        <p className="text-black text-sm mb-6">
          Universities and colleges can request Super Admin access by submitting
          official institution details below. Access will be granted only after
          platform verification.
        </p>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        {/* Applicant Details */}
        <h2 className="text-lg font-semibold text-black mb-2">
          Applicant Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            className="border p-2 rounded text-black"
            placeholder="Your Full Name"
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="email"
            className="border p-2 rounded text-black"
            placeholder="Official Email Address"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* University Details */}
        <h2 className="text-lg font-semibold text-black mb-2">
          University Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="border p-2 rounded text-black"
            placeholder="University / College Name"
            onChange={e =>
              setForm({ ...form, university_name: e.target.value })
            }
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="University Type (College / University / Institute)"
            onChange={e =>
              setForm({ ...form, university_type: e.target.value })
            }
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="AISHE Code"
            onChange={e => setForm({ ...form, aishe_code: e.target.value })}
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="UGC / AICTE ID"
            onChange={e =>
              setForm({ ...form, ugc_or_aicte_id: e.target.value })
            }
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="Official Email Domain (e.g. college.edu.in)"
            onChange={e =>
              setForm({ ...form, official_email_domain: e.target.value })
            }
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="State"
            onChange={e => setForm({ ...form, state: e.target.value })}
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="District"
            onChange={e => setForm({ ...form, district: e.target.value })}
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="University Website (optional)"
            onChange={e => setForm({ ...form, website: e.target.value })}
          />

          <input
            className="border p-2 rounded text-black"
            placeholder="Contact Phone (optional)"
            onChange={e => setForm({ ...form, contact_phone: e.target.value })}
          />

          <input
            type="number"
            className="border p-2 rounded text-black"
            placeholder="Established Year (optional)"
            onChange={e =>
              setForm({ ...form, established_year: e.target.value })
            }
          />
        </div>

        <button
          onClick={submitRequest}
          disabled={loading || !!success}
          className="mt-8 bg-indigo-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>

      </div>
    </div>
  );
}
