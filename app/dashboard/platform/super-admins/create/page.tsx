"use client";

import { useState } from "react";

export default function CreateSuperAdmin() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    university_name: ""
  });

  const submit = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/platform/super-admins`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      }
    );

    alert("Super Admin created and email sent");
  };

  return (
    <div className="p-6 max-w-xl text-white">
      <h1 className="text-2xl font-semibold  mb-4">
        Create University Admin
      </h1>

      <div className="space-y-4">
        <input
          placeholder="Name"
          className="border p-2 rounded w-full"
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          className="border p-2 rounded w-full"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="University Name"
          className="border p-2 rounded w-full"
          onChange={e =>
            setForm({ ...form, university_name: e.target.value })
          }
        />

        <button
          onClick={submit}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </div>
    </div>
  );
}
