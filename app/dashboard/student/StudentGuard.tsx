"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function StudentGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const res = await fetch(`${API}/students/marks/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      // 🚨 Profile incomplete → force redirect
      if (
        !data.profile_completed &&
        pathname !== "/dashboard/student/profile"
      ) {
        router.replace("/dashboard/student/profile");
        return;
      }

      setLoading(false);
    };

    checkProfile();
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking profile…
      </div>
    );
  }

  return <>{children}</>;
}
