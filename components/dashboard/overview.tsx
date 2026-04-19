"use client";

import { useMemo } from "react";
import { useFirebase } from "@/lib/firebase-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Wallet, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { bn } from "date-fns/locale";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export function DashboardOverview() {
  const { students, payments, expenses, attendance } = useFirebase();

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Calculate monthly income
  const monthlyIncome = useMemo(() => {
    return payments
      .filter((p) => {
        const paidDate = parseISO(p.paidDate);
        return isWithinInterval(paidDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, monthStart, monthEnd]);

  // Calculate monthly expenses
  const monthlyExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const expenseDate = parseISO(e.date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, monthStart, monthEnd]);

  // Calculate due payments
  const duePayments = useMemo(() => {
    const currentMonthStr = format(currentMonth, "yyyy-MM");
    const paidStudentIds = payments
      .filter((p) => `${p.year}-${String(p.month).padStart(2, "0")}` === currentMonthStr)
      .map((p) => p.studentId);

    return activeStudents.filter((s) => !paidStudentIds.includes(s.id)).length;
  }, [activeStudents, payments, currentMonth]);

  // Today's attendance
  const todayAttendance = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecords = attendance.filter((a) => a.date === today);
    const present = todayRecords.filter((a) => a.status === "present").length;
    const absent = todayRecords.filter((a) => a.status === "absent").length;
    return { present, absent, total: todayRecords.length };
  }, [attendance]);

  // Red alert students (3+ consecutive absences)
  const redAlertStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const studentAttendance = attendance
        .filter((a) => a.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let consecutiveDays = 0;
      for (const record of studentAttendance) {
        if (record.status === "absent") {
          consecutiveDays++;
        } else {
          break;
        }
      }
      return consecutiveDays >= 3;
    });
  }, [activeStudents, attendance]);

  // Overall attendance percentage
  const overallAttendancePercent = useMemo(() => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter((a) => a.status === "present").length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  // Batch distribution
  const batchDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    activeStudents.forEach((s) => {
      distribution[s.batch] = (distribution[s.batch] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [activeStudents]);

  // Last 6 months income data
  const incomeChart = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthStr = format(month, "yyyy-MM");
      const monthName = format(month, "MMM", { locale: bn });

      const income = payments
        .filter((p) => `${p.year}-${String(p.month).padStart(2, "0")}` === monthStr)
        .reduce((sum, p) => sum + p.amount, 0);

      data.push({ name: monthName, income });
    }
    return data;
  }, [payments]);

  const stats = [
    {
      title: "মোট শিক্ষার্থী",
      value: activeStudents.length,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "সামগ্রিক অ্যাটেনডেন্স",
      value: `${overallAttendancePercent}%`,
      icon: UserCheck,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "এই মাসের আয়",
      value: `৳${monthlyIncome.toLocaleString("bn-BD")}`,
      icon: TrendingUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "সতর্কবার্তা (৩+ দিন)",
      value: redAlertStudents.length,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Red Alert Section */}
      {redAlertStudents.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              সতর্কবার্তা - টানা ৩ দিন বা তার বেশি অনুপস্থিত ({redAlertStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {redAlertStudents.slice(0, 5).map((student) => (
                <div key={student.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ক্লাস: {student.class} | ব্যাচ: {student.batch}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-destructive">দ্রুত ব্যবস্থা প্রয়োজন</span>
                  </div>
                </div>
              ))}
              {redAlertStudents.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  এবং আরও {redAlertStudents.length - 5} জন শিক্ষার্থী
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">মাসিক আয়ের পরিসংখ্যান</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString("bn-BD")}`, "আয়"]}
                  />
                  <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Batch Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">ব্যাচ অনুযায়ী শিক্ষার্থী</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={batchDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {batchDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">এই মাসের আর্থিক সারসংক্ষেপ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-chart-3/10">
              <TrendingUp className="w-10 h-10 text-chart-3" />
              <div>
                <p className="text-sm text-muted-foreground">মোট আয়</p>
                <p className="text-xl font-bold">৳{monthlyIncome.toLocaleString("bn-BD")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/10">
              <TrendingDown className="w-10 h-10 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">মোট খরচ</p>
                <p className="text-xl font-bold">৳{monthlyExpenses.toLocaleString("bn-BD")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-chart-1/10">
              <Wallet className="w-10 h-10 text-chart-1" />
              <div>
                <p className="text-sm text-muted-foreground">নিট লাভ</p>
                <p className="text-xl font-bold">
                  ৳{(monthlyIncome - monthlyExpenses).toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
