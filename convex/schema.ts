import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // إعدادات عامة للمنصة (المدرسة، القسم، العام الأكاديمي...)
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  // المعلمات
  teachers: defineTable({
    name: v.string(),
    jobTitle: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    nationality: v.optional(v.string()),
    specialization: v.optional(v.string()), // التخصص
    grade: v.optional(v.string()), // الصف الذي تدرّسه
    section: v.optional(v.string()), // الشعبة
    subject: v.optional(v.string()), // المادة الأساسية
    yearsTrack: v.optional(v.string()), // سنوات الخبرة كمعلم بالمسار
    yearsTotal: v.optional(v.string()), // سنوات الخبرة بشكل عام
    followMode: v.optional(v.string()), // نمط المتابعة (مباشر / غير مباشر)
    hireDate: v.optional(v.string()),
    appointmentDate: v.optional(v.string()), // تاريخ التعيين
    phone: v.optional(v.string()),
    subjects: v.optional(v.array(v.string())),
    active: v.boolean(),
  }),

  // الشعب الدراسية
  classes: defineTable({
    grade: v.string(), // الأول / الثاني
    section: v.string(), // A..E
    active: v.boolean(),
  }),

  // الطالبات
  students: defineTable({
    name: v.string(),
    grade: v.string(),
    section: v.string(),
    level: v.optional(v.string()), // متفوقة / متوسطة / متعثرة
    readingLevel: v.optional(v.string()),
    writingLevel: v.optional(v.string()),
    behavior: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.boolean(),
  })
    .index("by_class", ["grade", "section"]),

  // محاضر الاجتماعات (جماعية وفردية)
  meetings: defineTable({
    type: v.string(), // group | individual
    number: v.optional(v.string()),
    date: v.string(),
    time: v.optional(v.string()),
    place: v.optional(v.string()),
    leader: v.optional(v.string()),
    attendees: v.optional(v.string()),
    absentees: v.optional(v.string()),
    teacherName: v.optional(v.string()), // للاجتماع الفردي
    goal: v.optional(v.string()),
    items: v.array(v.object({ title: v.string(), content: v.string() })),
    recommendations: v.optional(v.string()),
    followUp: v.optional(v.string()),
  }).index("by_date", ["date"]),

  // الزيارات الصفية (الجدول الشهري)
  visits: defineTable({
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(),
    grade: v.string(),
    section: v.string(),
    date: v.string(),
    month: v.string(),
    subject: v.string(),
    lesson: v.optional(v.string()),
    purpose: v.optional(v.string()), // هدف الزيارة
    attendanceType: v.optional(v.string()), // كلي | جزئي
    status: v.string(), // مخطط | تم
    notes: v.optional(v.string()),
  }).index("by_month", ["month"]),

  // استمارة زيارة المنسق الصفية لمعلم (التقييم التفصيلي بـ 22 مؤشر + توصية لكل مؤشر)
  classVisits: defineTable({
    teacherName: v.string(),
    subject: v.string(),
    grade: v.string(),
    section: v.string(),
    date: v.string(),
    lessonTopic: v.optional(v.string()),
    visitor: v.optional(v.string()),
    visitType: v.string(), // جزئية | كلية
    scores: v.array(v.object({ code: v.string(), score: v.number(), recommendation: v.optional(v.string()) })),
    followup: v.optional(v.array(v.string())), // بنود متابعة المنسقة المنفذة
    recommendations: v.optional(v.string()), // ملاحظات وتوصيات عامة
    sourceFileId: v.optional(v.id("_storage")), // الملف الأصلي المرفوع
  }).index("by_teacher", ["teacherName"]),

  // الخطة السنوية للقسم (المجال | الإجراءات | المنفذ | موعد الانتهاء | أدلة التنفيذ | المتابعة)
  annualPlanRows: defineTable({
    year: v.string(),
    order: v.number(),
    domain: v.string(),
    actions: v.string(),
    executor: v.optional(v.string()),
    deadline: v.optional(v.string()),
    evidence: v.optional(v.string()),
    followup: v.optional(v.string()),
    followupDate: v.optional(v.string()),
  }).index("by_year", ["year"]),

  // خطة التحصيل الأكاديمي (3 مراحل × أهداف)
  achievementPlanRows: defineTable({
    year: v.string(),
    stage: v.string(), // المرحلة الأولى: التخطيط وجمع البيانات | الثانية: التطبيق | الثالثة: التقييم والتقويم
    order: v.number(),
    goal: v.string(),
    actions: v.string(),
    responsible: v.optional(v.string()),
    timeframe: v.optional(v.string()),
    indicators: v.optional(v.string()),
    execution: v.optional(v.string()),
  }).index("by_year", ["year"]),

  // جدول أعمال المنسقة (لكل فترة زمنية)
  agendaEntries: defineTable({
    year: v.string(),
    term: v.string(), // الفصل الدراسي الأول | الثاني
    order: v.number(),
    period: v.string(), // الفترة الزمنية
    meetings: v.optional(v.string()), // الاجتماعات + التطوير + الحضور الصفي
    visitsCol: v.optional(v.string()), // الزيارات
    reportsCol: v.optional(v.string()), // التقارير
    events: v.optional(v.string()), // فعاليات المدرسة
    notes: v.optional(v.string()), // الملاحظات
  }).index("by_term", ["year", "term"]),

  // تصنيف أداء المعلمين (تعيين كل معلمة لفئة)
  teacherClassifications: defineTable({
    teacherName: v.string(),
    category: v.string(), // مستجد | دعم مكثف | دعم عام | تطوير ذاتي
    term: v.optional(v.string()),
  }).index("by_teacher", ["teacherName"]),

  // استمارة متابعة أداء معلم/ة — المرحلة التأسيسية (النموذج التفصيلي)
  performanceVisits: defineTable({
    // المعلومات الأساسية
    date: v.string(),
    day: v.optional(v.string()),
    subject: v.string(),
    unit: v.optional(v.string()),
    lessonTitle: v.optional(v.string()),
    visitType: v.string(), // كلي | جزئي
    visitNumber: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    // بيانات المعلم
    teacherName: v.string(), // الاسم الرباعي
    employeeNo: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationality: v.optional(v.string()),
    specialization: v.optional(v.string()),
    grade: v.string(),
    section: v.string(),
    yearsTrack: v.optional(v.string()),
    yearsTotal: v.optional(v.string()),
    followMode: v.optional(v.string()),
    // بيانات النائب الأكاديمي
    deputyName: v.optional(v.string()),
    feedbackAttendance: v.optional(v.string()),
    deputyNotes: v.optional(v.string()),
    // المؤشرات: لكل مؤشر تقييم + توصية نصية
    indicators: v.array(v.object({ code: v.string(), score: v.number(), recommendation: v.optional(v.string()) })),
    // الأقسام الختامية
    generalRecommendations: v.optional(v.string()),
    nextSteps: v.optional(v.string()),
    trainingNeeds: v.optional(v.string()),
    additionalNotes: v.optional(v.string()),
    // التواقيع والمناقشة
    coordinatorName: v.optional(v.string()),
    discussionTime: v.optional(v.string()),
    teacherAttended: v.optional(v.string()),
    sendDate: v.optional(v.string()),
    sourceFileId: v.optional(v.id("_storage")), // الملف الأصلي المرفوع (أرشفة)
  }).index("by_teacher", ["teacherName"]),

  // بنك التوصيات والملاحظات — فقرات جاهزة لإعادة الاستخدام
  recommendationBank: defineTable({
    code: v.string(), // رمز المؤشر (مثل 2.4) أو "عام"
    text: v.string(),
    tags: v.optional(v.string()),
  }).index("by_code", ["code"]),

  // التقرير الدوري الشهري للمعلمة (مقياس 1-3)
  periodicReports: defineTable({
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(),
    month: v.string(),
    date: v.optional(v.string()),
    scores: v.array(v.object({
      domain: v.string(),
      practice: v.string(),
      score: v.number(), // 1..3
      note: v.optional(v.string()),
    })),
    generalNotes: v.optional(v.string()),
  }).index("by_teacher", ["teacherName"]),

  // استمارة تقييم الأداء السنوية
  annualEvaluations: defineTable({
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(),
    personalNo: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    year: v.string(),
    penalties: v.optional(v.array(v.object({ type: v.string(), reason: v.string(), date: v.string() }))),
    courses: v.optional(v.array(v.object({ name: v.string(), place: v.string(), duration: v.string(), date: v.string() }))),
    indicators: v.array(v.object({
      domain: v.string(),
      indicator: v.string(),
      code: v.string(),
      maxScore: v.number(),
      score: v.number(),
    })),
    total: v.number(),
    levelLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_teacher", ["teacherName"]),

  // متابعة الأعمال الكتابية للطالبات
  writtenWorkRecords: defineTable({
    studentId: v.optional(v.id("students")),
    studentName: v.string(),
    grade: v.string(),
    section: v.string(),
    subject: v.string(),
    teacherName: v.optional(v.string()),
    term: v.optional(v.string()),
    notebook: v.optional(v.object({ date: v.string(), continuity: v.number(), accuracy: v.number(), reinforcement: v.number(), correction: v.number() })),
    homework: v.optional(v.object({ date: v.string(), accuracy: v.number(), reinforcement: v.number(), correction: v.number() })),
    quizzes: v.optional(v.object({ date: v.string(), accuracy: v.number(), reinforcement: v.number() })),
    feedback: v.optional(v.string()),
  }).index("by_class_subject", ["grade", "section", "subject"]),

  // نتائج الاختبارات لكل شعبة (التقرير الوصفي والكمي)
  examResults: defineTable({
    title: v.string(), // اسم التقرير/الاختبار
    subject: v.string(),
    term: v.string(),
    year: v.string(),
    rows: v.array(v.object({
      grade: v.string(),
      section: v.string(),
      passRate: v.number(),
      achievementRate: v.number(),
      addedValue: v.number(),
    })),
    riseReasons: v.optional(v.string()),
    declineReasons: v.optional(v.string()),
    coordinatorRecommendations: v.optional(v.string()),
    deputyRecommendations: v.optional(v.string()),
  }),

  // متابعة الخطة الفصلية (أسابيع × دروس)
  curriculumWeeks: defineTable({
    grade: v.string(),
    term: v.string(),
    weekNumber: v.number(),
    unit: v.optional(v.string()),
    arabicLessons: v.optional(v.string()),
    arabicDone: v.optional(v.boolean()),
    arabicNotes: v.optional(v.string()),
    islamicLessons: v.optional(v.string()),
    islamicDone: v.optional(v.boolean()),
    islamicNotes: v.optional(v.string()),
  }).index("by_grade_term", ["grade", "term"]),

  // التطوير المهني
  trainings: defineTable({
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(),
    programName: v.string(),
    date: v.string(),
    month: v.string(),
    hours: v.optional(v.string()),
    type: v.string(), // داخلي | خارجي
    category: v.optional(v.string()), // ورشة | مؤتمر | قراءة مهنية | مسابقة ...
    impact: v.optional(v.string()),
  }).index("by_teacher", ["teacherName"]),

  // القراءة المهنية
  professionalReadings: defineTable({
    teacherName: v.string(),
    date: v.string(),
    bookTitle: v.string(),
    summary: v.string(),
  }),

  // التقرير الشهري للمنسقة
  monthlyReports: defineTable({
    month: v.string(),
    year: v.string(),
    sections: v.array(v.object({
      domain: v.string(),
      subDomain: v.string(),
      summary: v.string(),
      notes: v.string(),
    })),
    deputyFeedback: v.optional(v.string()),
  }),

  // الإنجازات
  achievements: defineTable({
    month: v.string(),
    category: v.string(), // أكاديمية | إدارية | مجتمعية | داخل القسم
    description: v.string(),
  }),

  // التوصيات المتتبعة (من اجتماعات/زيارات/موجهين)
  recommendations: defineTable({
    source: v.string(),
    sourceLabel: v.optional(v.string()),
    text: v.string(),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.string(), // جديدة | قيد التنفيذ | منفذة
    createdDate: v.string(),
  }).index("by_status", ["status"]),

  // قوالب الاستمارات القابلة للتعديل من لوحة التحكم
  formTemplates: defineTable({
    key: v.string(), // periodicReport | annualEvaluation | writtenWork ...
    title: v.string(),
    description: v.optional(v.string()),
    fields: v.string(), // JSON: تعريف الحقول/المجالات/الممارسات
    active: v.boolean(),
  }).index("by_key", ["key"]),

  // سجل الاستئذان الأكاديمي — كل سجل ليوم/فترة، يحوي قائمة استئذانات
  leaveRegisters: defineTable({
    date: v.string(),
    day: v.optional(v.string()),
    term: v.optional(v.string()),
    department: v.optional(v.string()),
    entries: v.array(v.object({
      teacherName: v.string(),
      reason: v.string(),
      fromTime: v.optional(v.string()),
      toTime: v.optional(v.string()),
      deputyOpinion: v.optional(v.string()), // رأي النائبة الأكاديمية
    })),
  }).index("by_date", ["date"]),

  // سجل الاحتياط الأكاديمي — كل سجل ليوم، يحوي قائمة حصص احتياط
  coverRegisters: defineTable({
    date: v.string(),
    day: v.optional(v.string()),
    department: v.optional(v.string()),
    entries: v.array(v.object({
      teacherName: v.string(), // المعلمة الغائبة/صاحبة الحصة
      reason: v.string(), // غياب | تبديل | إشرافية فقط
      grade: v.optional(v.string()),
      section: v.optional(v.string()),
      period: v.optional(v.string()), // الحصة
      coverTeacher: v.string(), // معلمة الاحتياط
      planType: v.optional(v.string()), // مراجعة | درس | متابعة واجبات | تبديل درس
      notify: v.optional(v.string()), // إبلاغ قبل بوقت كافٍ | إبلاغ مباشرة | تم الرفض
      notes: v.optional(v.string()),
    })),
  }).index("by_date", ["date"]),
});
