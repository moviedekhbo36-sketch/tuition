"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone } from "lucide-react";
import { format, parseISO } from "date-fns";
import { bn } from "date-fns/locale";
import type { Student, Payment } from "@/lib/types";

interface StudentProfileDialogProps {
  student: Student | null;
  payments: Payment[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentProfileDialog({
  student,
  payments,
  isOpen,
  onOpenChange,
}: StudentProfileDialogProps) {
  if (!student) return null;

  // Filter payments for this student
  const studentPayments = payments.filter((p) => p.studentId === student.id);

  // Generate monthly breakdown
  const joinDate = parseISO(student.joinDate);
  const currentDate = new Date();
  const paymentsByMonth: Record<string, Payment> = {};

  studentPayments.forEach((p) => {
    const monthKey = `${p.year}-${String(p.month).padStart(2, "0")}`;
    paymentsByMonth[monthKey] = p;
  });

  const months = [];
  let checkDate = new Date(joinDate);
  while (checkDate <= currentDate) {
    const monthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}`;
    const payment = paymentsByMonth[monthKey];
    const monthName = format(checkDate, "MMMM yyyy", { locale: bn });

    months.push({
      key: monthKey,
      name: monthName,
      payment,
      status: payment ? "paid" : "due",
    });

    checkDate.setMonth(checkDate.getMonth() + 1);
  }

  // Calculate summary stats
  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidMonths = studentPayments.length;
  const dueMonths = months.filter((m) => !m.payment).length;

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = (phone: string) => {
    const message = encodeURIComponent(
      `প্রিয় অভিভাবক, ${student.name} সম্পর্কে আপনার সাথে যোগাযোগ করতে চাই। - AST Tuition`
    );
    window.location.href = `sms:${phone}?body=${message}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student.name} এর প্রোফাইল</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">মৌলিক তথ্য</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">নাম</p>
                <p className="font-medium">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ক্লাস</p>
                <p className="font-medium">{student.class}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">রোল</p>
                <p className="font-medium">{student.roll}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ব্যাচ</p>
                <p className="font-medium">{student.batch}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">যোগদানের তারিখ</p>
                <p className="font-medium">
                  {format(parseISO(student.joinDate), "dd MMMM yyyy", { locale: bn })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">মাসিক ফি</p>
                <p className="font-medium">৳{student.monthlyFee.toLocaleString("bn-BD")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">অভিভাবক ফোন</p>
                <p className="font-medium">{student.guardianPhone}</p>
              </div>
              {student.emergencyContact && (
                <div>
                  <p className="text-sm text-muted-foreground">জরুরি যোগাযোগ</p>
                  <p className="font-medium">{student.emergencyContact}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">পেমেন্ট সারাংশ</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">মোট প্রদান করা</p>
                <p className="text-xl font-bold">
                  ৳{totalPaid.toLocaleString("bn-BD")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-chart-2/10">
                <p className="text-sm text-chart-2">প্রদান করা মাস</p>
                <p className="text-xl font-bold text-chart-2">{paidMonths}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <p className="text-sm text-destructive">বকেয়া মাস</p>
                <p className="text-xl font-bold text-destructive">{dueMonths}</p>
              </div>
            </div>
          </div>

          {/* Monthly Payment History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">মাসিক পেমেন্ট ইতিহাস</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {months.map((month) => (
                <div
                  key={month.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{month.name}</p>
                    {month.payment && (
                      <p className="text-sm text-muted-foreground">
                        পেমেন্ট: {format(parseISO(month.payment.paidDate), "dd MMM yyyy", { locale: bn })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {month.payment && (
                      <div className="text-right">
                        <p className="font-semibold">
                          ৳{month.payment.amount.toLocaleString("bn-BD")}
                        </p>
                      </div>
                    )}
                    <Badge
                      variant={month.status === "paid" ? "default" : "destructive"}
                      className={month.status === "paid" ? "bg-chart-2" : ""}
                    >
                      {month.status === "paid" ? "প্রদান করা" : "বকেয়া"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCall(student.guardianPhone)}
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              কল করুন
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMessage(student.guardianPhone)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              মেসেজ পাঠান
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
