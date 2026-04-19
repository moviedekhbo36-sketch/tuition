"use client";

import { useState, useMemo } from "react";
import { useFirebase } from "@/lib/firebase-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  RotateCcw,
  Trash2,
  Download,
  Search,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Student } from "@/lib/types";

const batches = ["সকাল", "দুপুর", "বিকাল", "সন্ধ্যা"];

export function ArchiveSystem() {
  const { students, payments, restoreStudent, deleteStudent } = useFirebase();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");

  const archivedStudents = useMemo(
    () => students.filter((s) => s.isArchived),
    [students]
  );

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  // Get unique archive years
  const archiveYears = useMemo(() => {
    const years = new Set<number>();
    archivedStudents.forEach((s) => {
      if (s.archiveYear) years.add(s.archiveYear);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [archivedStudents]);

  const filteredStudents = useMemo(() => {
    return archivedStudents.filter((student) => {
      const matchesSearch = student.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesYear =
        filterYear === "all" || student.archiveYear?.toString() === filterYear;
      const matchesBatch = filterBatch === "all" || student.batch === filterBatch;
      return matchesSearch && matchesYear && matchesBatch;
    });
  }, [archivedStudents, searchQuery, filterYear, filterBatch]);

  // Group by batch for batch deletion
  const studentsByBatch = useMemo(() => {
    const grouped: Record<string, Student[]> = {};
    filteredStudents.forEach((s) => {
      if (!grouped[s.batch]) grouped[s.batch] = [];
      grouped[s.batch].push(s);
    });
    return grouped;
  }, [filteredStudents]);

  const handleRestore = async (student: Student) => {
    if (confirm(`"${student.name}" কে পুনরায় সক্রিয় করতে চান?`)) {
      await restoreStudent(student.id);
    }
  };

  const handleDelete = async (student: Student) => {
    if (
      confirm(
        `"${student.name}" কে স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`
      )
    ) {
      await deleteStudent(student.id);
    }
  };

  const handleDeleteBatch = async (batch: string) => {
    const batchStudents = studentsByBatch[batch] || [];
    if (
      confirm(
        `"${batch}" ব্যাচের ${batchStudents.length} জন শিক্ষার্থী স্থায়ীভাবে মুছে ফেলতে চান?`
      )
    ) {
      for (const student of batchStudents) {
        await deleteStudent(student.id);
      }
    }
  };

  const exportToExcel = (data: Student[], filename: string) => {
    const exportData = data.map((s) => ({
      নাম: s.name,
      ক্লাস: s.class,
      রোল: s.roll,
      ব্যাচ: s.batch,
      "অভিভাবকের নম্বর": s.guardianPhone,
      ঠিকানা: s.address,
      "জরুরি যোগাযোগ": s.emergencyContact,
      "মাসিক ফি": s.monthlyFee,
      "যোগদানের তারিখ": s.joinDate,
      "আর্কাইভ সাল": s.archiveYear || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToCSV = (data: Student[], filename: string) => {
    const exportData = data.map((s) => ({
      নাম: s.name,
      ক্লাস: s.class,
      রোল: s.roll,
      ব্যাচ: s.batch,
      "অভিভাবকের নম্বর": s.guardianPhone,
      ঠিকানা: s.address,
      "জরুরি যোগাযোগ": s.emergencyContact,
      "মাসিক ফি": s.monthlyFee,
      "যোগদানের তারিখ": s.joinDate,
      "আর্কাইভ সাল": s.archiveYear || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportFinanceToExcel = () => {
    const exportData = payments.map((p) => {
      const student = students.find((s) => s.id === p.studentId);
      return {
        "শিক্ষার্থীর নাম": student?.name || "Unknown",
        ক্লাস: student?.class || "-",
        ব্যাচ: student?.batch || "-",
        মাস: p.month,
        সাল: p.year,
        পরিমাণ: p.amount,
        "পরিশোধের তারিখ": p.paidDate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "payments_export.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">আর্কাইভ ও এক্সপোর্ট</h2>
          <p className="text-muted-foreground">
            আর্কাইভ করা শিক্ষার্থী: {archivedStudents.length} জন
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(activeStudents, "active_students")}
          >
            <Download className="w-4 h-4 mr-2" />
            সক্রিয় শিক্ষার্থী (Excel)
          </Button>
          <Button variant="outline" onClick={exportFinanceToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            পেমেন্ট রেকর্ড
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="সাল" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব সাল</SelectItem>
            {archiveYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBatch} onValueChange={setFilterBatch}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="ব্যাচ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ব্যাচ</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Export filtered archive */}
      {filteredStudents.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToExcel(filteredStudents, "archived_students")}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel এক্সপোর্ট ({filteredStudents.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(filteredStudents, "archived_students")}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV এক্সপোর্ট
          </Button>
        </div>
      )}

      {/* Batch Actions */}
      {Object.keys(studentsByBatch).length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ব্যাচ অনুযায়ী ডিলিট</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(studentsByBatch).map(([batch, batchStudents]) => (
                <Button
                  key={batch}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBatch(batch)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {batch} ({batchStudents.length})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archived Students List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">কোনো আর্কাইভ করা শিক্ষার্থী নেই</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{student.name}</h3>
                        <Badge variant="secondary">
                          আর্কাইভ: {student.archiveYear}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {student.class} | রোল: {student.roll} | {student.batch} ব্যাচ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.guardianPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(student)}
                      className="text-chart-2 hover:text-chart-2"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      পুনরুদ্ধার
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(student)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      ডিলিট
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
