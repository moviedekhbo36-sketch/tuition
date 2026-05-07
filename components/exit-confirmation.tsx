"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ExitConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingExit, setPendingExit] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Handle browser back button and window.location changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    // Listen to navigation attempts
    const handlePopState = () => {
      setIsOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleConfirmExit = () => {
    setIsOpen(false);
    window.removeEventListener("beforeunload", () => {});
    window.history.back();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ওয়েবসাইট থেকে বের হতে চান?</AlertDialogTitle>
          <AlertDialogDescription>
            আপনি কি নিশ্চিত যে আপনি ওয়েবসাইট থেকে বের হতে চান?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogCancel onClick={() => setIsOpen(false)}>না</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirmExit}>
          হ্যাঁ, বের হন
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
