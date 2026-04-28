"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/scan"); }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center text-ink-400">
      Redirecting…
    </div>
  );
}
