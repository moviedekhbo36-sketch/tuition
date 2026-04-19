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
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Sun,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isSameMonth,
} from "date-fns";
import { bn } from "date-fns/locale";

const batches = ["সকাল", "দুপুর", "বিকাল", "সন্ধ্যা"];

export function ScheduleSystem() {
  const { students, classes, scheduleItems, addScheduleItem, deleteScheduleItem } = useFirebase();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);
  const [bulkMessageBatch, setBulkMessageBatch] = useState("");
  const [bulkMessageText, setBulkMessageText] = useState("");

  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    type: "class" as "class" | "exam" | "holiday",
    date: format(new Date(), "yyyy-MM-dd"),
    batch: "",
    class: "",
    startTime: "",
    endTime: "",
  });

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  // Get days in current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get schedule items for a specific day
  const getItemsForDay = (date: Date) => {
    return scheduleItems.filter((item) =>
      isSameDay(parseISO(item.date), date)
    );
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await addScheduleItem(scheduleForm);
    setScheduleForm({
      title: "",
      type: "class",
      date: format(new Date(), "yyyy-MM-dd"),
      batch: "",
      class: "",
      startTime: "",
      endTime: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm("এই আইটেম মুছে ফেলতে চান?")) {
      await deleteScheduleItem(id);
    }
  };

  const handleSendBulkMessage = () => {
    if (!bulkMessageBatch || !bulkMessageText) return;

    const batchStudents = activeStudents.filter((s) => s.batch === bulkMessageBatch);
    const phones = batchStudents.map((s) => s.guardianPhone).join(",");
    const message = encodeURIComponent(bulkMessageText);

    // Open SMS app with multiple recipients (if supported)
    window.location.href = `sms:${phones}?body=${message}`;
    setIsBulkMessageOpen(false);
    setBulkMessageBatch("");
    setBulkMessageText("");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "class":
        return <BookOpen className="w-4 h-4" />;
      case "exam":
        return <FileText className="w-4 h-4" />;
      case "holiday":
        return <Sun className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "class":
        return "bg-chart-1/20 text-chart-1 border-chart-1/30";
      case "exam":
        return "bg-chart-3/20 text-chart-3 border-chart-3/30";
      case "holiday":
        return "bg-chart-2/20 text-chart-2 border-chart-2/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const selectedDateItems = selectedDate ? getItemsForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">রুটিন ও ক্যালেন্ডার</h2>
          <p className="text-muted-foreground">ক্লাস শিডিউল ও ইভেন্ট ম্যানেজমেন্ট</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                বাল্ক মেসেজ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>বাল্ক অ্যানাউন্সমেন্ট</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Field>
                  <FieldLabel>ব্যাচ বাছুন</FieldLabel>
                  <Select value={bulkMessageBatch} onValueChange={setBulkMessageBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="ব্যাচ বাছুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b} ({activeStudents.filter((s) => s.batch === b).length} জন)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>মেসেজ</FieldLabel>
                  <textarea
                    className="w-full h-32 p-3 rounded-lg border border-input bg-background resize-none"
                    placeholder="মেসেজ লিখুন..."
                    value={bulkMessageText}
                    onChange={(e) => setBulkMessageText(e.target.value)}
                  />
                </Field>
                <Button onClick={handleSendBulkMessage} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  মেসেজ পাঠান
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                নতুন ইভেন্ট
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন ইভেন্ট যোগ করুন</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSchedule} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>শিরোনাম</FieldLabel>
                    <Input
                      value={scheduleForm.title}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, title: e.target.value })
                      }
                      placeholder="যেমন: গণিত ক্লাস"
                      required
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>ধরন</FieldLabel>
                      <Select
                        value={scheduleForm.type}
                        onValueChange={(v: "class" | "exam" | "holiday") =>
                          setScheduleForm({ ...scheduleForm, type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="class">ক্লাস</SelectItem>
                          <SelectItem value="exam">পরীক্ষা</SelectItem>
                          <SelectItem value="holiday">ছুটি</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>তারিখ</FieldLabel>
                      <Input
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, date: e.target.value })
                        }
                        required
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>ব্যাচ (ঐচ্ছিক)</FieldLabel>
                      <Select
                        value={scheduleForm.batch}
                        onValueChange={(v) =>
                          setScheduleForm({ ...scheduleForm, batch: v })
                        }
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
                    <Field>
                      <FieldLabel>ক্লাস (ঐচ্ছিক)</FieldLabel>
                      <Select
                        value={scheduleForm.class}
                        onValueChange={(v) =>
                          setScheduleForm({ ...scheduleForm, class: v })
                        }
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>শুরুর সময়</FieldLabel>
                      <Input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>শেষের সময়</FieldLabel>
                      <Input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </FieldGroup>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    বাতিল
                  </Button>
                  <Button type="submit">যোগ করুন</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-lg">
              {format(currentMonth, "MMMM yyyy", { locale: bn })}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: monthDays[0]?.getDay() || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {monthDays.map((day) => {
              const dayItems = getItemsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 min-h-[80px] rounded-lg border transition-colors text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isToday
                      ? "border-chart-1 bg-chart-1/5"
                      : "border-transparent hover:border-border hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-chart-1" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${getTypeColor(
                          item.type
                        )}`}
                      >
                        {item.title}
                      </div>
                    ))}
                    {dayItems.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayItems.length - 2} আরো
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "dd MMMM yyyy", { locale: bn })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                এই দিনে কোনো ইভেন্ট নেই
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {item.startTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.startTime}
                              {item.endTime && ` - ${item.endTime}`}
                            </span>
                          )}
                          {item.batch && <Badge variant="outline">{item.batch}</Badge>}
                          {item.class && <Badge variant="outline">{item.class}</Badge>}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSchedule(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
