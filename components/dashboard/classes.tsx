"use client";

import { useState } from "react";
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
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";

export function ClassManagement() {
  const { classes, students, addClass, updateClass, deleteClass } = useFirebase();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [activeClass, setActiveClass] = useState<any>(null);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClass) {
      await updateClass(editingClass.id, formData);
      setEditingClass(null);
    } else {
      await addClass(formData);
    }

    setFormData({
      name: "",
      description: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleViewStudents = (classItem: any) => {
    setActiveClass(classItem);
    setIsStudentsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("এই ক্লাসটি মুছে ফেলতে চান?")) {
      await deleteClass(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">ক্লাস ম্যানেজমেন্ট</h2>
          <p className="text-muted-foreground">
            মোট {classes.length} টি ক্লাস
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingClass(null);
                setFormData({ name: "", description: "" });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              নতুন ক্লাস
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "ক্লাস আপডেট করুন" : "নতুন ক্লাস যোগ করুন"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>ক্লাসের নাম *</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="যেমন: ৬ষ্ঠ শ্রেণী"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>বর্ণনা</FieldLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="ক্লাসের বিবরণ (ঐচ্ছিক)"
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
                  {editingClass ? "আপডেট করুন" : "যোগ করুন"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes List */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <Card className="border-border/50 col-span-full">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">কোনো ক্লাস যোগ করা হয়নি</p>
            </CardContent>
          </Card>
        ) : (
          classes.map((classItem) => {
            const classStudents = students.filter(
              (student) => student.class === classItem.name && !student.isArchived
            );

            return (
              <Card key={classItem.id} className="border-border/50 hover:border-border transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {classItem.description && (
                    <p className="text-sm text-muted-foreground">
                      {classItem.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    শিক্ষার্থী: {classStudents.length} জন
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(classItem)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      সম্পাদনা
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStudents(classItem)}
                      className="flex-1"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      শিক্ষার্থী দেখুন
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeClass ? `${activeClass.name} ক্লাসের শিক্ষার্থীদের তালিকা` : "ক্লাসের শিক্ষার্থী"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {activeClass ? (
              students
                .filter(
                  (student) => student.class === activeClass.name && !student.isArchived
                )
                .map((student) => (
                  <Card key={student.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            রোল: {student.roll} | ব্যাচ: {student.batch}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          মাসিক ফি: ৳{student.monthlyFee}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <p className="text-muted-foreground">ক্লাস সিলেক্ট করুন শিক্ষার্থীদের দেখতে।</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
