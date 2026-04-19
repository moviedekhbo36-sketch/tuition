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
import {
  Plus,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import type { Exam, Student } from "@/lib/types";

const batches = ["সকাল", "দুপুর", "বিকাল", "সন্ধ্যা"];

export function ExamsSystem() {
  const {
    students,
    classes,
    exams,
    examResults,
    addExam,
    deleteExam,
    addExamResult,
    getResultsByExam,
  } = useFirebase();

  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [marksInput, setMarksInput] = useState<Record<string, string>>({});

  const [examForm, setExamForm] = useState({
    name: "",
    type: "weekly" as "weekly" | "monthly",
    date: format(new Date(), "yyyy-MM-dd"),
    totalMarks: 100,
    batch: "",
    class: "",
  });

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExam(examForm);
    setExamForm({
      name: "",
      type: "weekly",
      date: format(new Date(), "yyyy-MM-dd"),
      totalMarks: 100,
      batch: "",
      class: "",
    });
    setIsAddExamOpen(false);
  };

  const handleDeleteExam = async (examId: string) => {
    if (confirm("এই পরীক্ষা মুছে ফেলতে চান?")) {
      await deleteExam(examId);
    }
  };

  const getStudentsForExam = (exam: Exam) => {
    return activeStudents.filter(
      (s) =>
        (exam.batch === "" || s.batch === exam.batch) &&
        (exam.class === "" || s.class === exam.class)
    );
  };

  const handleSaveResult = async (examId: string, studentId: string) => {
    const marks = parseFloat(marksInput[studentId] || "0");
    if (isNaN(marks)) return;

    await addExamResult({
      examId,
      studentId,
      obtainedMarks: marks,
    });

    setMarksInput((prev) => ({ ...prev, [studentId]: "" }));
  };

  const getStudentResult = (examId: string, studentId: string) => {
    return examResults.find(
      (r) => r.examId === examId && r.studentId === studentId
    );
  };

  const handleSendResultMessage = (student: Student, exam: Exam, marks: number) => {
    const percentage = Math.round((marks / exam.totalMarks) * 100);
    const message = encodeURIComponent(
      `প্রিয় অভিভাবক,\n${student.name} "${exam.name}" পরীক্ষায় ${exam.totalMarks} এর মধ্যে ${marks} নম্বর পেয়েছে (${percentage}%)।\n- AST Tuition`
    );
    window.location.href = `sms:${student.guardianPhone}?body=${message}`;
  };

  const generateResultCard = async (student: Student, exam: Exam, marks: number) => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    const percentage = Math.round((marks / exam.totalMarks) * 100);

    // Header
    pdf.setFontSize(20);
    pdf.text("AST Tuition", 105, 20, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("Result Card", 105, 30, { align: "center" });

    // Student Info
    pdf.setFontSize(12);
    pdf.text(`Student Name: ${student.name}`, 20, 50);
    pdf.text(`Class: ${student.class}`, 20, 60);
    pdf.text(`Roll: ${student.roll}`, 20, 70);
    pdf.text(`Batch: ${student.batch}`, 20, 80);

    // Exam Info
    pdf.text(`Exam: ${exam.name}`, 20, 100);
    pdf.text(`Type: ${exam.type === "weekly" ? "Weekly" : "Monthly"}`, 20, 110);
    pdf.text(`Date: ${format(new Date(exam.date), "dd/MM/yyyy")}`, 20, 120);

    // Results
    pdf.setFontSize(14);
    pdf.text(`Obtained Marks: ${marks} / ${exam.totalMarks}`, 20, 140);
    pdf.text(`Percentage: ${percentage}%`, 20, 150);

    // Grade
    let grade = "F";
    if (percentage >= 80) grade = "A+";
    else if (percentage >= 70) grade = "A";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C";
    else if (percentage >= 40) grade = "D";

    pdf.text(`Grade: ${grade}`, 20, 160);

    // Footer
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${format(new Date(), "dd/MM/yyyy")}`, 20, 280);

    pdf.save(`${student.name}_${exam.name}_result.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">পরীক্ষা ও রেজাল্ট</h2>
          <p className="text-muted-foreground">পরীক্ষা তৈরি ও ফলাফল ট্র্যাকিং</p>
        </div>
        <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              নতুন পরীক্ষা
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন পরীক্ষা যোগ করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExam} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>পরীক্ষার নাম</FieldLabel>
                  <Input
                    value={examForm.name}
                    onChange={(e) =>
                      setExamForm({ ...examForm, name: e.target.value })
                    }
                    placeholder="যেমন: সাপ্তাহিক পরীক্ষা - ১"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>ধরন</FieldLabel>
                    <Select
                      value={examForm.type}
                      onValueChange={(v: "weekly" | "monthly") =>
                        setExamForm({ ...examForm, type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">সাপ্তাহিক</SelectItem>
                        <SelectItem value="monthly">মাসিক</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>তারিখ</FieldLabel>
                    <Input
                      type="date"
                      value={examForm.date}
                      onChange={(e) =>
                        setExamForm({ ...examForm, date: e.target.value })
                      }
                      required
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>পূর্ণ নম্বর</FieldLabel>
                  <Input
                    type="number"
                    value={examForm.totalMarks}
                    onChange={(e) =>
                      setExamForm({ ...examForm, totalMarks: Number(e.target.value) })
                    }
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>ক্লাস (ঐচ্ছিক)</FieldLabel>
                    <Select
                      value={examForm.class}
                      onValueChange={(v) => setExamForm({ ...examForm, class: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সব ক্লাস" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">সব ক্লাস</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>ব্যাচ (ঐচ্ছিক)</FieldLabel>
                    <Select
                      value={examForm.batch}
                      onValueChange={(v) => setExamForm({ ...examForm, batch: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সব ব্যাচ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">সব ব্যাচ</SelectItem>
                        {batches.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddExamOpen(false)}
                >
                  বাতিল
                </Button>
                <Button type="submit">যোগ করুন</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exam List */}
      <div className="space-y-4">
        {exams.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">কোনো পরীক্ষা যোগ করা হয়নি</p>
            </CardContent>
          </Card>
        ) : (
          exams
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((exam) => {
              const examStudents = getStudentsForExam(exam);
              const results = getResultsByExam(exam.id);
              const isExpanded = expandedExam === exam.id;

              return (
                <Card key={exam.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{exam.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(exam.date), "dd MMMM yyyy", { locale: bn })} |{" "}
                            {exam.type === "weekly" ? "সাপ্তাহিক" : "মাসিক"} | পূর্ণ নম্বর:{" "}
                            {exam.totalMarks}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {results.length}/{examStudents.length} ফলাফল
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setExpandedExam(isExpanded ? null : exam.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-4 border-t border-border">
                      <div className="space-y-3">
                        {examStudents.map((student) => {
                          const result = getStudentResult(exam.id, student.id);
                          const hasResult = !!result;

                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.class} | রোল: {student.roll}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasResult ? (
                                  <>
                                    <span className="font-bold">
                                      {result.obtainedMarks}/{exam.totalMarks}
                                    </span>
                                    <Badge>
                                      {Math.round(
                                        (result.obtainedMarks / exam.totalMarks) * 100
                                      )}
                                      %
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleSendResultMessage(
                                          student,
                                          exam,
                                          result.obtainedMarks
                                        )
                                      }
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        generateResultCard(
                                          student,
                                          exam,
                                          result.obtainedMarks
                                        )
                                      }
                                    >
                                      PDF
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Input
                                      type="number"
                                      placeholder="নম্বর"
                                      className="w-20"
                                      value={marksInput[student.id] || ""}
                                      onChange={(e) =>
                                        setMarksInput({
                                          ...marksInput,
                                          [student.id]: e.target.value,
                                        })
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleSaveResult(exam.id, student.id)
                                      }
                                    >
                                      সংরক্ষণ
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
