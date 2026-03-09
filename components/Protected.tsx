"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";

const ROLE_LEVEL: Record<string, number> = {
  super_admin: 3,
  platform_admin: 2,
  faculty: 1,
  student: 0,
};

export default function Protected({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await getCurrentUser();

      if (!me) {
        window.location.replace("/login");
        return;
      }

      if (role) {
        const userLevel = ROLE_LEVEL[me.role];
        const requiredLevel = ROLE_LEVEL[role];

        if (
          userLevel === undefined ||
          requiredLevel === undefined ||
          userLevel < requiredLevel
        ) {
          console.warn(
            `Unauthorized access ${me.role} needed : ${role}`
          );
          window.location.replace("/dashboard");
          return;
        }
      }

      setLoading(false);
    }

    load();
  }, [role]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return <>{children}</>;
}
