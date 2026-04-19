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
import { Checkbox } from "@/components/ui/checkbox";
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  Copy,
  Check,
} from "lucide-react";

const batches = ["সকাল", "দুপুর", "বিকাল", "সন্ধ্যা"];

const predefinedTemplates = [
  {
    id: "attendance",
    name: "উপস্থিতি সতর্কতা",
    template: "Dear Guardian,\n[Student] was absent for [Days] days in [Month].",
  },
  {
    id: "payment",
    name: "পেমেন্ট নিশ্চয়তা",
    template: "Dear Guardian,\nPayment received for [Student]\nMonth: [Month] [Year]\nAmount: [Amount] BDT.Thanks",
  },
  {
    id: "general",
    name: "প্রাইভেট বন্ধ",
    template: "Dear Student,\nPrivate tutoring will remain closed tomorrow.",
  },
  {
    id: "holiday",
    name: "ছুটি ঘোষণা",
    template: "Dear Students,\nClasses will remain closed on [Date].",
  },
];
export function BulkSMS() {
  const { students, classes } = useFirebase();
  const [filterType, setFilterType] = useState<"batch" | "class">("batch");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isArchived),
    [students]
  );

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    let result = activeStudents;

    if (filterType === "batch" && selectedBatch) {
      result = result.filter((s) => s.batch === selectedBatch);
    }

    if (filterType === "class" && selectedClass) {
      const selectedClassObj = classes.find((c) => c.id === selectedClass);
      if (selectedClassObj) {
        result = result.filter((s) => s.class === selectedClassObj.name);
      }
    }

    return result;
  }, [activeStudents, filterType, selectedBatch, selectedClass, classes]);

  // Get phone numbers for selected students
  const selectedPhones = useMemo(() => {
    return filteredStudents
      .filter((s) => selectedStudents.includes(s.id))
      .map((s) => s.guardianPhone)
      .filter(Boolean);
  }, [filteredStudents, selectedStudents]);

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select/Deselect all
  const toggleAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = predefinedTemplates.find((t) => t.id === templateId);
    if (template) {
      setMessageText(template.template);
      setSelectedTemplate(templateId);
    }
  };

  // Send bulk message
  const handleSendMessage = () => {
    if (selectedPhones.length === 0 || !messageText) {
      alert("অনুগ্রহ করে শিক্ষার্থী এবং মেসেজ নির্বাচন করুন");
      return;
    }

    const phones = selectedPhones.join(",");
    const message = encodeURIComponent(messageText);

    // Open SMS app with multiple recipients (if supported)
    window.location.href = `sms:${phones}?body=${message}`;
    
    // Reset after sending
    setMessageText("");
    setSelectedStudents([]);
    setSelectedTemplate("");
    setIsSendDialogOpen(false);
  };

  // Copy phone numbers to clipboard
  const copyPhonesToClipboard = () => {
    const phones = selectedPhones.join(", ");
    navigator.clipboard.writeText(phones);
    setCopiedPhone("all");
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const allSelected = selectedStudents.length === filteredStudents.length;
  const someSelected = selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">বাল্ক এসএমএস</h2>
          <p className="text-muted-foreground">একাধিক অভিভাবকদের কাছে একসাথে মেসেজ পাঠান</p>
        </div>
      </div>

      {/* Templates Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">প্রি-ডিফাইনড টেমপ্লেট</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {predefinedTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className="justify-start h-auto py-3 px-4"
                onClick={() => applyTemplate(template.id)}
              >
                <div className="text-left">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.template}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">শিক্ষার্থী নির্বাচন</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={filterType === "batch" ? "default" : "outline"}
              onClick={() => {
                setFilterType("batch");
                setSelectedClass("");
                setSelectedStudents([]);
              }}
            >
              ব্যাচ অনুযায়ী
            </Button>
            <Button
              variant={filterType === "class" ? "default" : "outline"}
              onClick={() => {
                setFilterType("class");
                setSelectedBatch("");
                setSelectedStudents([]);
              }}
            >
              ক্লাস অনুযায়ী
            </Button>
          </div>

          {/* Batch Selection */}
          {filterType === "batch" && (
            <Field>
              <FieldLabel>ব্যাচ নির্বাচন করুন</FieldLabel>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
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
          )}

          {/* Class Selection */}
          {filterType === "class" && (
            <Field>
              <FieldLabel>ক্লাস নির্বাচন করুন</FieldLabel>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="ক্লাস বাছুন" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({activeStudents.filter((s) => s.class === c.name).length} জন)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Select All Checkbox */}
          {filteredStudents.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) {
                    ref.indeterminate = someSelected;
                  }
                }}
                onCheckedChange={toggleAllStudents}
              />
              <label className="text-sm font-medium cursor-pointer flex-1">
                সব ({filteredStudents.length} জন) নির্বাচন করুন
              </label>
            </div>
          )}

          {/* Students List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                কোনো শিক্ষার্থী পাওয়া যায়নি
              </p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.guardianPhone}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {student.batch}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Composition */}
      {selectedStudents.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              মেসেজ লিখুন ({selectedStudents.length} জনকে)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>মেসেজ বিষয়বস্তু</FieldLabel>
              <textarea
                className="w-full h-40 p-3 rounded-lg border border-input bg-background resize-none font-mono text-sm"
                placeholder="আপনার মেসেজ এখানে লিখুন..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                সাপোর্ট করা ভেরিয়েবল: [Student], [Month], [Year], [Days], [Amount]
              </p>
            </Field>

            {/* Selected Phone Numbers Preview */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">ফোন নম্বর ({selectedPhones.length})</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPhonesToClipboard}
                  className="gap-2"
                >
                  {copiedPhone === "all" ? (
                    <>
                      <Check className="w-4 h-4" />
                      কপি হয়েছে
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      কপি করুন
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {selectedPhones.join(", ")}
              </p>
            </div>

            {/* Send Button */}
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full gap-2 bg-chart-1 hover:bg-chart-1/90"
                  disabled={!messageText || selectedPhones.length === 0}
                >
                  <Send className="w-4 h-4" />
                  মেসেজ পাঠান
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>মেসেজ পাঠানোর নিশ্চয়তা</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-2">প্রাপক ({selectedPhones.length} জন):</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {selectedPhones.join(", ")}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-2">মেসেজ:</p>
                    <p className="text-sm whitespace-pre-wrap">{messageText}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsSendDialogOpen(false)}
                    >
                      বাতিল
                    </Button>
                    <Button onClick={handleSendMessage} className="gap-2">
                      <Send className="w-4 h-4" />
                      নিশ্চিত - পাঠান
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
