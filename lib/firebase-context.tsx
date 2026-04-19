"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Student,
  Attendance,
  Payment,
  Exam,
  ExamResult,
  Expense,
  ScheduleItem,
  Class,
} from "./types";

interface FirebaseContextType {
  students: Student[];
  addStudent: (student: Omit<Student, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  archiveStudent: (id: string, year: number) => Promise<void>;
  restoreStudent: (id: string) => Promise<void>;

  attendance: Attendance[];
  markAttendance: (studentId: string, date: string, status: "present" | "absent") => Promise<void>;
  getAttendanceByStudent: (studentId: string) => Attendance[];
  getAttendanceByDate: (date: string) => Attendance[];

  payments: Payment[];
  addPayment: (payment: Omit<Payment, "id" | "createdAt">) => Promise<string>;
  getPaymentsByStudent: (studentId: string) => Payment[];
  deletePayment: (id: string) => Promise<void>;

  exams: Exam[];
  addExam: (exam: Omit<Exam, "id" | "createdAt">) => Promise<string>;
  updateExam: (id: string, data: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;

  examResults: ExamResult[];
  addExamResult: (result: Omit<ExamResult, "id" | "createdAt">) => Promise<string>;
  getResultsByExam: (examId: string) => ExamResult[];
  getResultsByStudent: (studentId: string) => ExamResult[];

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<string>;
  deleteExpense: (id: string) => Promise<void>;

  scheduleItems: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, "id" | "createdAt">) => Promise<string>;
  deleteScheduleItem: (id: string) => Promise<void>;

  classes: Class[];
  addClass: (classData: Omit<Class, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateClass: (id: string, classData: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  loading: boolean;
  refreshData: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

// Helper functions for localStorage
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Firebase mode
      const studentsSnapshot = await getDocs(collection(db, "students"));
      setStudents(studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]);

      const attendanceSnapshot = await getDocs(collection(db, "attendance"));
      setAttendance(attendanceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Attendance[]);

      const paymentsSnapshot = await getDocs(collection(db, "payments"));
      setPayments(paymentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Payment[]);

      const examsSnapshot = await getDocs(collection(db, "exams"));
      setExams(examsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Exam[]);

      const resultsSnapshot = await getDocs(collection(db, "examResults"));
      setExamResults(resultsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ExamResult[]);

      const expensesSnapshot = await getDocs(collection(db, "expenses"));
      setExpenses(expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Expense[]);

      const scheduleSnapshot = await getDocs(collection(db, "schedule"));
      setScheduleItems(scheduleSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ScheduleItem[]);

      const classesSnapshot = await getDocs(collection(db, "classes"));
      setClasses(classesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Class[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Student operations
  const addStudent = async (student: Omit<Student, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "students"), { ...student, createdAt: now, updatedAt: now });
    const newStudent = { ...student, id: docRef.id, createdAt: now, updatedAt: now } as Student;
    setStudents((prev) => [...prev, newStudent]);
    return docRef.id;
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const updatedData = { ...data, updatedAt: new Date().toISOString() };
    
    await updateDoc(doc(db, "students", id), updatedData);
    
    const updated = students.map((s) => (s.id === id ? { ...s, ...updatedData } : s));
    setStudents(updated);
  };

  const deleteStudent = async (id: string) => {
    await deleteDoc(doc(db, "students", id));
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
  };

  const archiveStudent = async (id: string, year: number) => {
    await updateStudent(id, { isArchived: true, archiveYear: year });
  };

  const restoreStudent = async (id: string) => {
    await updateStudent(id, { isArchived: false, archiveYear: undefined });
  };

  // Attendance operations
  const markAttendance = async (studentId: string, date: string, status: "present" | "absent") => {
    const existing = attendance.find((a) => a.studentId === studentId && a.date === date);

    if (existing) {
      await updateDoc(doc(db, "attendance", existing.id), { status });
      const updated = attendance.map((a) => (a.id === existing.id ? { ...a, status } : a));
      setAttendance(updated);
    } else {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, "attendance"), { studentId, date, status, createdAt: now });
      const newAttendance = { id: docRef.id, studentId, date, status, createdAt: now };
      const updated = [...attendance, newAttendance];
      setAttendance(updated);
    }
  };

  const getAttendanceByStudent = (studentId: string) => attendance.filter((a) => a.studentId === studentId);
  const getAttendanceByDate = (date: string) => attendance.filter((a) => a.date === date);

  // Payment operations
  const addPayment = async (payment: Omit<Payment, "id" | "createdAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "payments"), { ...payment, createdAt: now });
    setPayments((prev) => [...prev, { ...payment, id: docRef.id, createdAt: now }]);
    return docRef.id;
  };

  const getPaymentsByStudent = (studentId: string) => payments.filter((p) => p.studentId === studentId);

  const deletePayment = async (id: string) => {
    await deleteDoc(doc(db, "payments", id));
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
  };

  // Exam operations
  const addExam = async (exam: Omit<Exam, "id" | "createdAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "exams"), { ...exam, createdAt: now });
    setExams((prev) => [...prev, { ...exam, id: docRef.id, createdAt: now }]);
    return docRef.id;
  };

  const updateExam = async (id: string, data: Partial<Exam>) => {
    await updateDoc(doc(db, "exams", id), data);
    const updated = exams.map((e) => (e.id === id ? { ...e, ...data } : e));
    setExams(updated);
  };

  const deleteExam = async (id: string) => {
    await deleteDoc(doc(db, "exams", id));
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
  };

  // Exam Result operations
  const addExamResult = async (result: Omit<ExamResult, "id" | "createdAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "examResults"), { ...result, createdAt: now });
    setExamResults((prev) => [...prev, { ...result, id: docRef.id, createdAt: now }]);
    return docRef.id;
  };

  const getResultsByExam = (examId: string) => examResults.filter((r) => r.examId === examId);
  const getResultsByStudent = (studentId: string) => examResults.filter((r) => r.studentId === studentId);

  // Expense operations
  const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "expenses"), { ...expense, createdAt: now });
    setExpenses((prev) => [...prev, { ...expense, id: docRef.id, createdAt: now }]);
    return docRef.id;
  };

  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, "expenses", id));
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
  };

  // Schedule operations
  const addScheduleItem = async (item: Omit<ScheduleItem, "id" | "createdAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "schedule"), { ...item, createdAt: now });
    setScheduleItems((prev) => [...prev, { ...item, id: docRef.id, createdAt: now }]);
    return docRef.id;
  };

  const deleteScheduleItem = async (id: string) => {
    await deleteDoc(doc(db, "schedule", id));
    const updated = scheduleItems.filter((s) => s.id !== id);
    setScheduleItems(updated);
  };

  // Class operations
  const addClass = async (classData: Omit<Class, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "classes"), { ...classData, createdAt: now, updatedAt: now });
    setClasses((prev) => [...prev, { ...classData, id: docRef.id, createdAt: now, updatedAt: now }]);
    return docRef.id;
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    const updatedData = { ...classData, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, "classes", id), updatedData);
    const updated = classes.map((c) => (c.id === id ? { ...c, ...updatedData } : c));
    setClasses(updated);
  };

  const deleteClass = async (id: string) => {
    await deleteDoc(doc(db, "classes", id));
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
  };

  return (
    <FirebaseContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        archiveStudent,
        restoreStudent,
        attendance,
        markAttendance,
        getAttendanceByStudent,
        getAttendanceByDate,
        payments,
        addPayment,
        getPaymentsByStudent,
        deletePayment,
        exams,
        addExam,
        updateExam,
        deleteExam,
        examResults,
        addExamResult,
        getResultsByExam,
        getResultsByStudent,
        expenses,
        addExpense,
        deleteExpense,
        scheduleItems,
        addScheduleItem,
        deleteScheduleItem,
        classes,
        addClass,
        updateClass,
        deleteClass,
        loading,
        refreshData: fetchAllData,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
