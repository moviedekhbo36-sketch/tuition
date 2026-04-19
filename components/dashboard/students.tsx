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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { FilterBar } from "./filter-bar";
import { StudentProfileDialog } from "./student-profile-dialog";
import {
  Plus,
  Search,
  Phone,
  MessageSquare,
  Edit,
  Archive,
  Filter,
  User,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { Student } from "@/lib/types";

const batches = ["সকাল", "দুপুর", "বিকাল", "সন্ধ্যা"];

export function StudentManagement() {
  const { students, payments, classes, addStudent, updateStudent, archiveStudent } = useFirebase();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    class: "",
    roll: "",
    batch: "",
    guardianPhone: "",
    address: "",
    emergencyContact: "",
    monthlyFee: 500,
    joinDate: "",
  });

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  // Check payment status for current month
  const getPaymentStatus = (studentId: string) => {
    const currentMonth = format(new Date(), "MM");
    const currentYear = new Date().getFullYear();
    const day = new Date().getDate();

    const hasPaid = payments.some(
      (p) =>
        p.studentId === studentId &&
        p.month === currentMonth &&
        p.year === currentYear
    );

    if (hasPaid) return "paid";
    if (day > 10) return "due";
    return "pending";
  };

  const filteredStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll.includes(searchQuery);

      const matchesClass = filterClass === "all" || student.class === filterClass;

      const paymentStatus = getPaymentStatus(student.id);
      const matchesPayment =
        filterPayment === "all" || paymentStatus === filterPayment;

      return matchesSearch && matchesClass && matchesPayment;
    });
  }, [activeStudents, searchQuery, filterClass, filterPayment, payments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStudent) {
      await updateStudent(editingStudent.id, formData);
      setEditingStudent(null);
    } else {
      await addStudent({
        ...formData,
        isArchived: false,
        joinDate: formData.joinDate || new Date().toISOString(),
      });
    }

    setFormData({
      name: "",
      class: "",
      roll: "",
      batch: "",
      guardianPhone: "",
      address: "",
      emergencyContact: "",
      monthlyFee: 500,
      joinDate: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      class: student.class,
      roll: student.roll,
      batch: student.batch,
      guardianPhone: student.guardianPhone,
      address: student.address,
      emergencyContact: student.emergencyContact,
      monthlyFee: student.monthlyFee,
      joinDate: student.joinDate ? new Date(student.joinDate).toISOString().split('T')[0] : "",
    });
    setIsAddDialogOpen(true);
  };

  const handleArchive = async (student: Student) => {
    if (confirm(`"${student.name}" কে আর্কাইভ করতে চান?`)) {
      await archiveStudent(student.id, new Date().getFullYear());
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = (phone: string, studentName: string) => {
    const message = encodeURIComponent(
      `প্রিয় অভিভাবক, ${studentName} সম্পর্কে আপনার সাথে যোগাযোগ করতে চাই। - AST Tuition`
    );
    window.location.href = `sms:${phone}?body=${message}`;
  };

  const PaymentBadge = ({ studentId }: { studentId: string }) => {
    const status = getPaymentStatus(studentId);
    if (status === "paid") {
      return <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30">Paid</Badge>;
    }
    if (status === "due") {
      return <Badge variant="destructive">Due</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">শিক্ষার্থী ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">
            মোট {activeStudents.length} জন শিক্ষার্থী
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingStudent(null);
                setFormData({
                  name: "",
                  class: "",
                  roll: "",
                  batch: "",
                  guardianPhone: "",
                  address: "",
                  emergencyContact: "",
                  monthlyFee: 500,
                  joinDate: "",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              নতুন শিক্ষার্থী
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "শিক্ষার্থী আপডেট করুন" : "নতুন শিক্ষার্থী যোগ করুন"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>নাম</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="শিক্ষার্থীর নাম"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>ক্লাস</FieldLabel>
                    <Select
                      value={formData.class}
                      onValueChange={(v) => setFormData({ ...formData, class: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ক্লাস" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>রোল</FieldLabel>
                    <Input
                      value={formData.roll}
                      onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                      placeholder="রোল নম্বর"
                      required
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>ব্যাচ</FieldLabel>
                  <Select
                    value={formData.batch}
                    onValueChange={(v) => setFormData({ ...formData, batch: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ব্যাচ" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>অভিভাবকের নম্বর</FieldLabel>
                  <Input
                    value={formData.guardianPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianPhone: e.target.value })
                    }
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>ঠিকানা</FieldLabel>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="ঠিকানা"
                  />
                </Field>
                <Field>
                  <FieldLabel>জরুরি যোগাযোগ</FieldLabel>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContact: e.target.value })
                    }
                    placeholder="জরুরি যোগাযোগ নম্বর"
                  />
                </Field>
                <Field>
                  <FieldLabel>মাসিক ফি (টাকা)</FieldLabel>
                  <Input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyFee: Number(e.target.value) })
                    }
                    placeholder="500"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>প্রাইভেটে যুক্ত হওয়ার তারিখ</FieldLabel>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    placeholder="যুক্ত হওয়ার তারিখ"
                  />
                </Field>
              </FieldGroup>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  বাতিল
                </Button>
                <Button type="submit">
                  {editingStudent ? "আপডেট করুন" : "যোগ করুন"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <FilterBar
          searchPlaceholder="নাম বা রোল দিয়ে খুঁজুন..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={[
            {
              id: "class",
              label: "ক্লাস",
              value: filterClass,
              onChange: setFilterClass,
              options: [
                ...classes.map((c) => ({
                  id: c.id,
                  label: c.name,
                  value: c.name,
                })),
              ],
            },
            {
              id: "payment",
              label: "পেমেন্ট স্ট্যাটাস",
              value: filterPayment,
              onChange: setFilterPayment,
              options: [
                { id: "paid", label: "Paid", value: "paid" },
                { id: "due", label: "Due", value: "due" },
                { id: "pending", label: "Pending", value: "pending" },
              ],
            },
          ]}
        />
      </div>

      {/* Student List */}
      <div className="grid gap-4">
        {filteredStudents.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="border-border/50 hover:border-border transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => {
                      setSelectedProfileStudent(student);
                      setIsProfileDialogOpen(true);
                    }}>
                      <span className="text-lg font-bold text-primary">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => {
                      setSelectedProfileStudent(student);
                      setIsProfileDialogOpen(true);
                    }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate hover:underline">{student.name}</h3>
                        <PaymentBadge studentId={student.id} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {student.class} | রোল: {student.roll} | {student.batch} ব্যাচ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.guardianPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCall(student.guardianPhone)}
                      className="text-chart-2 hover:text-chart-2"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMessage(student.guardianPhone, student.name)}
                      className="text-chart-1 hover:text-chart-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleArchive(student)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <StudentProfileDialog
        student={selectedProfileStudent}
        payments={payments}
        isOpen={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </div>
  );
}
