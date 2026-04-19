"use client";

import { useState, useMemo } from "react";
import { useFirebase } from "@/lib/firebase-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { FilterBar } from "./filter-bar";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { bn } from "date-fns/locale";
import type { Student } from "@/lib/types";

const months = [
  { value: "01", label: "জানুয়ারি" },
  { value: "02", label: "ফেব্রুয়ারি" },
  { value: "03", label: "মার্চ" },
  { value: "04", label: "এপ্রিল" },
  { value: "05", label: "মে" },
  { value: "06", label: "জুন" },
  { value: "07", label: "জুলাই" },
  { value: "08", label: "আগস্ট" },
  { value: "09", label: "সেপ্টেম্বর" },
  { value: "10", label: "অক্টোবর" },
  { value: "11", label: "নভেম্বর" },
  { value: "12", label: "ডিসেম্বর" },
];

const expenseCategories = [
  "শিট প্রিন্টিং",
  "মার্কার/স্টেশনারি",
  "কারেন্ট বিল",
  "রুম ভাড়া",
  "অন্যান্য",
];

export function FinanceSystem() {
  const { students, payments, expenses, addPayment, addExpense, deleteExpense, deletePayment } =
    useFirebase();

  const [activeTab, setActiveTab] = useState("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MM"));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [paymentConfirmStudent, setPaymentConfirmStudent] = useState<Student | null>(null);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
  const [revertPaymentId, setRevertPaymentId] = useState<string | null>(null);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    description: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, parseInt(selectedMonth) - 1));
    const monthEnd = endOfMonth(monthStart);

    const monthPayments = payments.filter((p) => {
      const paidDate = parseISO(p.paidDate);
      return isWithinInterval(paidDate, { start: monthStart, end: monthEnd });
    });

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = parseISO(e.date);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });

    const totalIncome = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      income: totalIncome,
      expense: totalExpense,
      profit: totalIncome - totalExpense,
      paymentCount: monthPayments.length,
    };
  }, [payments, expenses, selectedMonth, selectedYear]);

  // Get payment status for students
  const getPaymentStatus = (studentId: string) => {
    const hasPaid = payments.some(
      (p) =>
        p.studentId === studentId &&
        p.month === selectedMonth &&
        p.year === selectedYear
    );
    return hasPaid;
  };

  const filteredStudents = useMemo(() => {
    return activeStudents.filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeStudents, searchQuery]);

  const handleAddPayment = (student: Student) => {
    setPaymentConfirmStudent(student);
    setIsPaymentConfirmOpen(true);
  };

  const confirmAddPayment = async () => {
    if (!paymentConfirmStudent) return;
    await addPayment({
      studentId: paymentConfirmStudent.id,
      amount: paymentConfirmStudent.monthlyFee,
      month: selectedMonth,
      year: selectedYear,
      paidDate: new Date().toISOString(),
    });
    setIsPaymentConfirmOpen(false);
    setPaymentConfirmStudent(null);
  };

  const getPaymentRecord = (studentId: string) =>
    payments.find(
      (p) =>
        p.studentId === studentId &&
        p.month === selectedMonth &&
        p.year === selectedYear
    );

  const handleRevertPayment = (paymentId: string) => {
    setRevertPaymentId(paymentId);
    setIsRevertDialogOpen(true);
  };

  const confirmRevertPayment = async () => {
    if (!revertPaymentId) return;
    await deletePayment(revertPaymentId);
    setIsRevertDialogOpen(false);
    setRevertPaymentId(null);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense(expenseForm);
    setExpenseForm({
      category: "",
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setIsExpenseDialogOpen(false);
  };

  const generateReceipt = async (student: Student) => {
    const payment = payments.find(
      (p) =>
        p.studentId === student.id &&
        p.month === selectedMonth &&
        p.year === selectedYear
    );

    if (!payment) return;

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    // Use English month name instead of Bengali
    const englishMonthIndex = parseInt(selectedMonth) - 1;
    const englishMonth = new Date(2024, englishMonthIndex).toLocaleString('en-US', { month: 'long' });

    // Header
    pdf.setFontSize(24);
    pdf.text("AST Tuition", 105, 25, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("Money Receipt", 105, 35, { align: "center" });

    // Receipt details
    pdf.setFontSize(12);
    pdf.text(`Receipt No: ${payment.id.slice(-8).toUpperCase()}`, 20, 55);
    pdf.text(`Date: ${format(parseISO(payment.paidDate), "dd/MM/yyyy")}`, 20, 65);

    // Student Info
    pdf.text(`Student Name: ${student.name}`, 20, 85);
    pdf.text(`Class: ${student.class}`, 20, 95);
    pdf.text(`Roll: ${student.roll}`, 20, 105);

    // Payment Details
    pdf.setFontSize(14);
    pdf.text(`Payment For: ${englishMonth} ${selectedYear}`, 20, 125);
    pdf.text(`Amount Paid: ${payment.amount} Taka`, 20, 140);

    // Footer
    pdf.setFontSize(10);
    pdf.text("Thank you for your payment!", 105, 170, { align: "center" });
    pdf.text("AST Tuition Management System", 105, 180, { align: "center" });

    pdf.save(`${student.name}_receipt_${englishMonth}_${selectedYear}.pdf`);
  };

  const sendPaymentMessage = (student: Student) => {
    const monthName = months.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    const englishMonthIndex = parseInt(selectedMonth) - 1;
    const englishMonth = new Date(2024, englishMonthIndex).toLocaleString('en-US', { month: 'long' });
    
    // English pre-filled message
    const message = encodeURIComponent(
      `Dear Guardian,\nPayment received for ${student.name}\nMonth: ${englishMonth} ${selectedYear}\nAmount: ${student.monthlyFee} BDT\n\nThank you for your payment.\n\nBest Regards,\nAST Tuition`
    );
    window.location.href = `sms:${student.guardianPhone}?body=${message}`;
  };

  const monthlyExpenses = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, parseInt(selectedMonth) - 1));
    const monthEnd = endOfMonth(monthStart);

    return expenses.filter((e) => {
      const expenseDate = parseISO(e.date);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
  }, [expenses, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">আর্থিক হিসাব</h2>
        <p className="text-muted-foreground">আয়-ব্যয় ও পেমেন্ট ট্র্যাকিং</p>
      </div>

      {/* Month/Year Selector */}
      <div className="flex gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedYear.toString()}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-chart-2/30 bg-chart-2/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-chart-2" />
              <div>
                <p className="text-sm text-muted-foreground">মোট আয়</p>
                <p className="text-xl font-bold">
                  ৳{monthlyStats.income.toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">মোট খরচ</p>
                <p className="text-xl font-bold">
                  ৳{monthlyStats.expense.toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-chart-1/30 bg-chart-1/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-chart-1" />
              <div>
                <p className="text-sm text-muted-foreground">নিট লাভ</p>
                <p className="text-xl font-bold">
                  ৳{monthlyStats.profit.toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">পেমেন্ট</TabsTrigger>
          <TabsTrigger value="expenses">খরচ</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <FilterBar
            searchPlaceholder="শিক্ষার্থী খুঁজুন..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[]}
          />

          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const isPaid = getPaymentStatus(student.id);

              return (
                <Card key={student.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isPaid ? "bg-chart-2/20" : "bg-destructive/20"
                          }`}
                        >
                          <span
                            className={`text-lg font-bold ${
                              isPaid ? "text-chart-2" : "text-destructive"
                            }`}
                          >
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{student.name}</h3>
                            {isPaid ? (
                              <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30">
                                Paid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Due</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {student.class} | ফি: ৳{student.monthlyFee}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPaid ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateReceipt(student)}
                            >
                              <Receipt className="w-4 h-4 mr-1" />
                              রিসিট
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendPaymentMessage(student)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              মেসেজ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const payment = getPaymentRecord(student.id);
                                if (payment) handleRevertPayment(payment.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              রিভার্ট
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddPayment(student)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            পেমেন্ট নিন
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <AlertDialog open={isPaymentConfirmOpen} onOpenChange={setIsPaymentConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>পেমেন্ট নিশ্চিত করুন</AlertDialogTitle>
                <AlertDialogDescription>
                  আপনি কি নিশ্চিত যে এই শিক্ষার্থীর মাসিক ফি গ্রহণ করতে চান?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAddPayment}>
                  নিশ্চিত করুন
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>পেমেন্ট রিভার্ট করুন</AlertDialogTitle>
                <AlertDialogDescription>
                  আপনি কি নিশ্চিত যে এই পেমেন্টকে ডিউ হিসেবে ফেরত আনতে চান?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>না</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRevertPayment}>
                  হ্যাঁ, ফেরত আনুন
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                নতুন খরচ যোগ করুন
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন খরচ যোগ করুন</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>ক্যাটাগরি</FieldLabel>
                    <Select
                      value={expenseForm.category}
                      onValueChange={(v) =>
                        setExpenseForm({ ...expenseForm, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ক্যাটাগরি বাছুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>বিবরণ</FieldLabel>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, description: e.target.value })
                      }
                      placeholder="খরচের বিবরণ"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>পরিমাণ (টাকা)</FieldLabel>
                    <Input
                      type="number"
                      value={expenseForm.amount || ""}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          amount: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>তারিখ</FieldLabel>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, date: e.target.value })
                      }
                      required
                    />
                  </Field>
                </FieldGroup>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpenseDialogOpen(false)}
                  >
                    বাতিল
                  </Button>
                  <Button type="submit">যোগ করুন</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {monthlyExpenses.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">এই মাসে কোনো খরচ নেই</p>
                </CardContent>
              </Card>
            ) : (
              monthlyExpenses.map((expense) => (
                <Card key={expense.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.description} |{" "}
                            {format(parseISO(expense.date), "dd MMM", { locale: bn })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-destructive">
                          ৳{expense.amount.toLocaleString("bn-BD")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
