"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { Tab } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  FileText,
  Wallet,
  MessageSquare,
  Archive,
  LogOut,
  GraduationCap,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "students", label: "শিক্ষার্থী", icon: Users },
  { id: "classes", label: "ক্লাস", icon: BookOpen },
  { id: "attendance", label: "অ্যাটেনডেন্স", icon: CalendarCheck },
  { id: "exams", label: "পরীক্ষা ও রেজাল্ট", icon: FileText },
  { id: "finance", label: "আর্থিক হিসাব", icon: Wallet },
  { id: "bulksms", label: "বাল্ক এসএমএস", icon: MessageSquare },
  { id: "archive", label: "আর্কাইভ", icon: Archive },
];

export function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">AST Tuition</h1>
                <p className="text-xs text-sidebar-foreground/60">ম্যানেজমেন্ট সিস্টেম</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5" />
                  লাইট মোড
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  ডার্ক মোড
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              লগআউট
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
