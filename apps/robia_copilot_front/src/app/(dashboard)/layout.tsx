import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AuthGate from "@/components/providers/AuthGate";

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <SidebarProvider>
        <Sidebar />

        <SidebarInset>
          <div className="flex min-h-screen flex-col bg-gray-50 text-dark-slate">
            <Navbar />
            <main className="flex-1 overflow-y-auto bg-secondary/20 p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGate>
  );
}