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
import { FilterBar } from "./filter-bar";
import {
  CalendarDays,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Search,
} from "lucide-react";
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { bn } from "date-fns/locale";

export function AttendanceSystem() {
  const { students, attendance, markAttendance, clearAttendance, getAttendanceByStudent, classes } = useFirebase();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  const filteredStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === "all" || student.class === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [activeStudents, searchQuery, selectedClass]);

  // Get attendance for selected date
  const dateAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  // Calculate attendance percentage for a student
  const getAttendancePercentage = (studentId: string) => {
    const studentAttendance = getAttendanceByStudent(studentId);
    if (studentAttendance.length === 0) return 0;

    const presentDays = studentAttendance.filter((a) => a.status === "present").length;
    return Math.round((presentDays / studentAttendance.length) * 100);
  };

  // Check consecutive absent days
  const getConsecutiveAbsentDays = (studentId: string) => {
    const studentAttendance = getAttendanceByStudent(studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let consecutiveDays = 0;
    for (const record of studentAttendance) {
      if (record.status === "absent") {
        consecutiveDays++;
      } else {
        break;
      }
    }
    return consecutiveDays;
  };

  // Get monthly absent count
  const getMonthlyAbsentCount = (studentId: string) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return getAttendanceByStudent(studentId).filter((a) => {
      const date = parseISO(a.date);
      return a.status === "absent" && date >= monthStart && date <= monthEnd;
    }).length;
  };

  const getStudentStatus = (studentId: string) => {
    const record = dateAttendance.find((a) => a.studentId === studentId);
    return record?.status;
  };

  const handleMarkAttendance = async (studentId: string, status: "present" | "absent") => {
    await markAttendance(studentId, selectedDate, status);
  };

  const handleClearAttendance = async (studentId: string) => {
    await clearAttendance(studentId, selectedDate);
  };

  const handleSendAbsenceMessage = (student: typeof activeStudents[0]) => {
    const monthlyAbsent = getMonthlyAbsentCount(student.id);
    const currentMonth = format(new Date(), "MMMM");

    // English pre-filled message
    const message = encodeURIComponent(
      `Dear Guardian,\n${student.name} was absent for ${monthlyAbsent} days in ${currentMonth}. Please ensure regular attendance.\n\nRegards,\nAST Tuition`
    );
    window.location.href = `sms:${student.guardianPhone}?body=${message}`;
  };

  // Stats for today
  const todayStats = useMemo(() => {
    const present = dateAttendance.filter((a) => a.status === "present").length;
    const absent = dateAttendance.filter((a) => a.status === "absent").length;
    return { present, absent };
  }, [dateAttendance]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">অ্যাটেনডেন্স</h2>
        <p className="text-muted-foreground">দৈনিক উপস্থিতি ট্র্যাকিং</p>
      </div>

      {/* Date and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        <FilterBar
          searchPlaceholder="নাম দিয়ে খুঁজুন..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={[
            {
              id: "class",
              label: "ক্লাস",
              value: selectedClass,
              onChange: setSelectedClass,
              options: classes.map((c) => ({
                id: c.id,
                label: c.name,
                value: c.name,
              })),
            },
          ]}
        />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-chart-2/30 bg-chart-2/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-chart-2">{todayStats.present}</p>
            <p className="text-sm text-muted-foreground">উপস্থিত</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{todayStats.absent}</p>
            <p className="text-sm text-muted-foreground">অনুপস্থিত</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {/* Red Alert Students */}
        {filteredStudents.filter((s) => getConsecutiveAbsentDays(s.id) >= 3).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-destructive">
                সতর্কবার্তা - টানা ৩ দিন বা তার বেশি অনুপস্থিত
              </h3>
            </div>
            <div className="space-y-2">
              {filteredStudents
                .filter((s) => getConsecutiveAbsentDays(s.id) >= 3)
                .map((student) => {
                  const consecutiveAbsent = getConsecutiveAbsentDays(student.id);
                  const monthlyAbsent = getMonthlyAbsentCount(student.id);
                  const attendancePercent = getAttendancePercentage(student.id);
                  const status = getStudentStatus(student.id);

                  return (
                    <Card
                      key={student.id}
                      className="border-destructive/50 bg-destructive/5"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                status === "present"
                                  ? "bg-chart-2/20"
                                  : status === "absent"
                                  ? "bg-destructive/20"
                                  : "bg-destructive/20"
                              }`}
                            >
                              <span
                                className={`text-lg font-bold ${
                                  status === "present"
                                    ? "text-chart-2"
                                    : status === "absent"
                                    ? "text-destructive"
                                    : "text-destructive"
                                }`}
                              >
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                ক্লাস: {student.class} | ব্যাচ: {student.batch} | অ্যাটেনডেন্স: {attendancePercent}%
                              </p>
                              <p className="text-xs text-destructive font-medium mt-1">
                                টানা {consecutiveAbsent} দিন অনুপস্থিত | এই মাসে {monthlyAbsent} দিন
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={status === "present" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, "present")}
                              className={
                                status === "present"
                                  ? "bg-chart-2 hover:bg-chart-2/90"
                                  : "hover:bg-chart-2/10 hover:text-chart-2 hover:border-chart-2"
                              }
                            >
                              <Check className="w-4 h-4 mr-1" />
                              উপস্থিত
                            </Button>
                            <Button
                              variant={status === "absent" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleMarkAttendance(student.id, "absent")}
                              className={
                                status === "absent"
                                  ? "bg-destructive hover:bg-destructive/90"
                                  : "hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                              }
                            >
                              <X className="w-4 h-4 mr-1" />
                              অনুপস্থিত
                            </Button>
                            {status && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClearAttendance(student.id)}
                                className="hover:bg-muted hover:text-muted-foreground"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                ক্লিয়ার
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleSendAbsenceMessage(student)}
                              className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              অভিভাবককে জানান
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        {/* All Students */}
        <div>
          {filteredStudents.filter((s) => getConsecutiveAbsentDays(s.id) < 3).length > 0 && (
            <h3 className="font-semibold mb-3">সাধারণ শিক্ষার্থী</h3>
          )}
          {filteredStudents
            .filter((s) => getConsecutiveAbsentDays(s.id) < 3)
            .map((student) => {
              const status = getStudentStatus(student.id);
              const attendancePercent = getAttendancePercentage(student.id);

              return (
                <Card key={student.id} className="border-border/50 mb-3">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            status === "present"
                              ? "bg-chart-2/20"
                              : status === "absent"
                              ? "bg-destructive/20"
                              : "bg-muted"
                          }`}
                        >
                          <span
                            className={`text-lg font-bold ${
                              status === "present"
                                ? "text-chart-2"
                                : status === "absent"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {student.class} | {student.batch} | অ্যাটেনডেন্স: {attendancePercent}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={status === "present" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, "present")}
                          className={
                            status === "present"
                              ? "bg-chart-2 hover:bg-chart-2/90"
                              : "hover:bg-chart-2/10 hover:text-chart-2 hover:border-chart-2"
                          }
                        >
                          <Check className="w-4 h-4 mr-1" />
                          উপস্থিত
                        </Button>
                        <Button
                          variant={status === "absent" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleMarkAttendance(student.id, "absent")}
                          className={
                            status === "absent"
                              ? "bg-destructive hover:bg-destructive/90"
                              : "hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                          }
                        >
                          <X className="w-4 h-4 mr-1" />
                          অনুপস্থিত
                        </Button>
                        {status && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearAttendance(student.id)}
                            className="hover:bg-muted hover:text-muted-foreground"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            ক্লিয়ার
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
