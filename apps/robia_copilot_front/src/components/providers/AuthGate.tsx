"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiService } from "@/lib/apiService";
import { sessionStore } from "@/lib/session";

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const token = sessionStore.getToken();
      if (!token) {
        sessionStore.clearSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        await apiService.getMe();
        if (isMounted) {
          setIsReady(true);
        }
      } catch {
        sessionStore.clearSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (!isReady) {
    return null;
  }

  return children;
}