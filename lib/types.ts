export interface Student {
  id: string;
  name: string;
  class: string;
  roll: string;
  batch: string;
  guardianPhone: string;
  address: string;
  emergencyContact: string;
  monthlyFee: number;
  joinDate: string;
  isArchived: boolean;
  archiveYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: "present" | "absent";
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  month: string;
  year: number;
  paidDate: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  name: string;
  type: "weekly" | "monthly";
  date: string;
  totalMarks: number;
  batch: string;
  class: string;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  obtainedMarks: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  type: "class" | "exam" | "holiday";
  date: string;
  batch?: string;
  class?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatus {
  studentId: string;
  studentName: string;
  month: string;
  year: number;
  isPaid: boolean;
  dueDate: string;
  paidDate?: string;
  amount: number;
}

export type Tab =
  | "dashboard"
  | "students"
  | "classes"
  | "attendance"
  | "exams"
  | "finance"
  | "bulksms"
  | "archive";
