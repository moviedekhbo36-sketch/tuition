"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useFirebase } from "@/lib/firebase-context";
import { Sidebar } from "./sidebar";
import { DashboardOverview } from "./overview";
import { StudentManagement } from "./students";
import { ClassManagement } from "./classes";
import { AttendanceSystem } from "./attendance";
import { BulkSMS } from "./bulk-sms";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Menu } from "lucide-react";
import type { Tab } from "@/lib/types";

// Dynamic imports for components using jsPDF/xlsx to avoid SSR issues
const ExamsSystem = dynamic(() => import("./exams").then((mod) => mod.ExamsSystem), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12">
      <Spinner className="w-6 h-6" />
    </div>
  ),
});

const FinanceSystem = dynamic(() => import("./finance").then((mod) => mod.FinanceSystem), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12">
      <Spinner className="w-6 h-6" />
    </div>
  ),
});

const ArchiveSystem = dynamic(() => import("./archive").then((mod) => mod.ArchiveSystem), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12">
      <Spinner className="w-6 h-6" />
    </div>
  ),
});

export function Dashboard() {
  const { loading } = useFirebase();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <StudentManagement />;
      case "classes":
        return <ClassManagement />;
      case "attendance":
        return <AttendanceSystem />;
      case "exams":
        return <ExamsSystem />;
      case "finance":
        return <FinanceSystem />;
      case "bulksms":
        return <BulkSMS />;
      case "archive":
        return <ArchiveSystem />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">AST Tuition Manager</h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">{renderContent()}</div>
      </main>
    </div>
  );
}
