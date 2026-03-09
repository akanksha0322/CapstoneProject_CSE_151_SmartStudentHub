import { Suspense } from "react";
import SetPasswordPage from "./SetPasswordClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SetPasswordPage />
    </Suspense>
  );
}
