"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import dynamic from "next/dynamic";

const AIChat = dynamic(() => import("@/components/ui/AIChat"), { ssr: false });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f7]">
        <div className="w-8 h-8 border-2 border-[#6d5cff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#f0f2f7]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8 max-w-[1440px]">
        {children}
      </main>
      <AIChat />
    </div>
  );
}
