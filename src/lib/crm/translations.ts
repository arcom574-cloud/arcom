const translations = {
  // Layout & Nav
  sidebar: { ar: 'القائمة', en: 'Menu' },
  home: { ar: 'الرئيسية', en: 'Dashboard' },
  leads: { ar: 'الليدز', en: 'Leads' },
  pipeline: { ar: 'البايبلاين', en: 'Pipeline' },
  units: { ar: 'الوحدات', en: 'Units' },
  visits: { ar: 'المعاينات', en: 'Site Visits' },
  meetings: { ar: 'غرف الاجتماعات', en: 'Meeting Rooms' },
  calls: { ar: 'المكالمات', en: 'Calls' },
  reports: { ar: 'التقارير', en: 'Reports' },
  targets: { ar: 'الأهداف', en: 'Targets' },
  users: { ar: 'المستخدمين', en: 'Users' },
  knowledge: { ar: 'قاعدة المعرفة', en: 'Knowledge Base' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  payments: { ar: 'المدفوعات', en: 'Payments' },
  activity_feed: { ar: 'النشاط', en: 'Activity' },
  audit_log: { ar: 'سجل المراجعة', en: 'Audit Log' },
  logout: { ar: 'تسجيل خروج', en: 'Logout' },
  superadmin: { ar: 'سوبر أدمن', en: 'Super Admin' },
  admin: { ar: 'أدمن', en: 'Admin' },
  head_sales: { ar: 'هيد أوف سيلز', en: 'Head of Sales' },
  sales: { ar: 'سيلز', en: 'Sales' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  loginBtn: { ar: 'دخول', en: 'Login' },
  loginError: { ar: 'البريد الإلكتروني أو كلمة المرور غلط', en: 'Invalid email or password' },

  // Status
  status_new: { ar: 'جديد', en: 'New' },
  status_contacted: { ar: 'تم التواصل', en: 'Contacted' },
  status_meeting_scheduled: { ar: 'موعد محدد', en: 'Meeting Set' },
  status_site_visit: { ar: 'زيارة ميدانية', en: 'Site Visit' },
  status_negotiation: { ar: 'تفاوض', en: 'Negotiation' },
  status_contract: { ar: 'عقد', en: 'Contract' },
  status_closed_won: { ar: 'تم البيع', en: 'Closed Won' },
  status_closed_lost: { ar: 'فاقد', en: 'Closed Lost' },
  status_postponed: { ar: 'مؤجل', en: 'Postponed' },
  status_interested: { ar: 'مهتم', en: 'Interested' },

  // Sources
  source_manual: { ar: 'يدوي', en: 'Manual' },
  source_website: { ar: 'موقع', en: 'Website' },
  source_facebook: { ar: 'فيسبوك', en: 'Facebook' },
  source_whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  source_google: { ar: 'جوجل', en: 'Google' },
  source_chatbot: { ar: '🤖 شات بوت', en: '🤖 Chatbot' },

  // Dashboard
  welcome: { ar: 'مرحباً', en: 'Welcome' },
  overview_all: { ar: 'نظرة شاملة على كل الشركة', en: 'Company overview' },
  overview_team: { ar: 'فريقك وأداء السيلز', en: 'Your team performance' },
  overview_personal: { ar: 'أداءك ومتابعاتك', en: 'Your performance' },
  total_sales: { ar: 'إجمالي المبيعات المغلقة', en: 'Total Closed Sales' },
  my_sales: { ar: 'مبيعاتك المغلقة', en: 'Your Closed Sales' },
  pipeline_value: { ar: 'قيمة الـ Pipeline المتوقعة', en: 'Expected Pipeline Value' },
  my_pipeline: { ar: 'Pipeline بتاعك', en: 'Your Pipeline' },
  total_leads: { ar: 'إجمالي الليدز', en: 'Total Leads' },
  my_leads: { ar: 'ليدز مخصصة ليك', en: 'Your Assigned Leads' },
  conversion_rate: { ar: 'نسبة التحويل', en: 'Conversion Rate' },
  closed_deals: { ar: 'صفقات مغلقة', en: 'Closed Deals' },
  needs_followup: { ar: 'ليدز محتاجة متابعة', en: 'Needs Follow-up' },
  stage_distribution: { ar: 'توزيع الليدز على المراحل', en: 'Lead Stage Distribution' },
  my_stage_distribution: { ar: 'توزيع ليدزك على المراحل', en: 'Your Lead Distribution' },
  monthly_targets: { ar: 'تحقيق أهداف الشهر', en: 'Monthly Target Progress' },
  manage_targets: { ar: 'إدارة الأهداف', en: 'Manage Targets' },
  admin_performance: { ar: 'أداء المديرين (Admins)', en: 'Admin Performance' },
  sales_leaderboard: { ar: 'ترتيب السيلز', en: 'Sales Leaderboard' },
  urgent_followup: { ar: 'محتاجين متابعة فورية', en: 'Urgent Follow-up' },
  all_followed: { ar: 'كل الليدز متابعة 🎉', en: 'All leads followed up 🎉' },
  full_details: { ar: 'تفاصيل كاملة', en: 'Full Details' },
  late: { ar: 'متأخر', en: 'Late' },
  unassigned: { ar: 'غير محدد', en: 'Unassigned' },
  egp: { ar: 'جنيه', en: 'EGP' },

  // Leads
  search_placeholder: { ar: '🔍 بحث باسم أو تليفون', en: '🔍 Search by name or phone' },
  all_statuses: { ar: 'كل الحالات', en: 'All Statuses' },
  all_sources: { ar: 'كل المصادر', en: 'All Sources' },
  all_projects: { ar: 'كل المشاريع', en: 'All Projects' },
  bulk_assign: { ar: '📦 توزيع جماعي', en: '📦 Bulk Assign' },
  transfer_selected: { ar: 'تحويل المحدد', en: 'Transfer Selected' },
  export_excel: { ar: '📥 تصدير Excel', en: '📥 Export Excel' },
  import_file: { ar: '📂 استيراد ملف', en: '📂 Import File' },
  add_lead: { ar: '+ إضافة ليد', en: '+ Add Lead' },
  name: { ar: 'الاسم', en: 'Name' },
  phone: { ar: 'التليفون', en: 'Phone' },
  project: { ar: 'المشروع', en: 'Project' },
  score: { ar: 'Score', en: 'Score' },
  value: { ar: 'القيمة', en: 'Value' },
  source: { ar: 'المصدر', en: 'Source' },
  status: { ar: 'الحالة', en: 'Status' },
  last_contact: { ar: 'آخر تواصل', en: 'Last Contact' },
  responsible: { ar: 'المسؤول', en: 'Assigned To' },
  actions: { ar: 'إجراءات', en: 'Actions' },
  details: { ar: 'تفاصيل', en: 'Details' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  call: { ar: 'اتصال', en: 'Call' },
  transfer: { ar: 'تحويل', en: 'Transfer' },
  today: { ar: 'اليوم', en: 'Today' },
  yesterday: { ar: 'أمس', en: 'Yesterday' },
  days: { ar: 'يوم', en: 'days' },
  not_done: { ar: 'لم يتم', en: 'Never' },
  no_leads: { ar: 'لا يوجد ليدز', en: 'No leads found' },
  prev: { ar: 'السابق', en: 'Previous' },
  next: { ar: 'التالي', en: 'Next' },
  page_of: { ar: 'صفحة', en: 'Page' },
  of: { ar: 'من', en: 'of' },
  lead: { ar: 'ليد', en: 'lead' },
  duplicate: { ar: 'مكرر', en: 'Duplicate' },
  duplicate_count: { ar: 'رقم مكرر', en: 'duplicate numbers' },
  chatbot: { ar: 'شات بوت', en: 'Chatbot' },
  from_chatbot: { ar: 'من الشات بوت', en: 'from Chatbot' },
  hot: { ar: 'ساخن 🔥', en: 'Hot 🔥' },
  warm: { ar: 'دافئ ☀️', en: 'Warm ☀️' },
  cold: { ar: 'بارد ❄️', en: 'Cold ❄️' },

  // Lead Detail
  lead_data: { ar: 'بيانات الليد', en: 'Lead Info' },
  comments: { ar: 'التعليقات', en: 'Comments' },
  whatsapp_tab: { ar: '💬 واتساب', en: '💬 WhatsApp' },
  calls_tab: { ar: 'المكالمات', en: 'Calls' },
  reminders: { ar: 'التذكيرات', en: 'Reminders' },
  activity: { ar: 'النشاط', en: 'Activity' },
  edit: { ar: '✏️ تعديل', en: '✏️ Edit' },
  site_visit_btn: { ar: '🚗 معاينة', en: '🚗 Site Visit' },
  save: { ar: '💾 حفظ', en: '💾 Save' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  saving: { ar: 'جاري الحفظ...', en: 'Saving...' },
  send: { ar: 'إرسال', en: 'Send' },
  no_comments: { ar: 'لا يوجد تعليقات', en: 'No comments' },
  write_comment: { ar: 'اكتب تعليق...', en: 'Write a comment...' },
  send_unit: { ar: '🏢 إرسال تفاصيل وحدة', en: '🏢 Send Unit Details' },

  // Pipeline
  drag_leads: { ar: 'اسحب الليدز بين المراحل', en: 'Drag leads between stages' },

  // Units
  unit_management: { ar: 'إدارة الوحدات', en: 'Unit Management' },
  add_unit: { ar: '+ إضافة وحدة', en: '+ Add Unit' },
  unit_number: { ar: 'رقم الوحدة', en: 'Unit No.' },
  unit_type: { ar: 'النوع', en: 'Type' },
  floor: { ar: 'الدور', en: 'Floor' },
  area: { ar: 'المساحة', en: 'Area' },
  price: { ar: 'السعر', en: 'Price' },
  view: { ar: 'الإطلالة', en: 'View' },
  available: { ar: 'متاح', en: 'Available' },
  reserved: { ar: 'محجوز', en: 'Reserved' },
  sold: { ar: 'مباع', en: 'Sold' },
  client: { ar: 'العميل', en: 'Client' },
  total_units: { ar: 'إجمالي الوحدات', en: 'Total Units' },
  sold_value: { ar: 'قيمة المباع', en: 'Sold Value' },

  // Notifications
  notifications: { ar: 'الإشعارات', en: 'Notifications' },
  read_all: { ar: 'قراءة الكل', en: 'Read All' },
  no_notifications: { ar: 'لا يوجد إشعارات', en: 'No notifications' },

  // Common
  select_project: { ar: 'اختر مشروع', en: 'Select Project' },
  select_user: { ar: 'اختر مستخدم', en: 'Select User' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  date: { ar: 'التاريخ', en: 'Date' },
  currency: { ar: 'ج', en: 'EGP' },
} as const;

export type TranslationKey = keyof typeof translations;
export type CrmLocale = 'ar' | 'en';

export function t(key: TranslationKey, locale: CrmLocale): string {
  return translations[key]?.[locale] || translations[key]?.ar || key;
}

export function getStatusLabel(locale: CrmLocale): Record<string, string> {
  return {
    new: t('status_new', locale), contacted: t('status_contacted', locale),
    meeting_scheduled: t('status_meeting_scheduled', locale), site_visit: t('status_site_visit', locale),
    negotiation: t('status_negotiation', locale), contract: t('status_contract', locale),
    closed_won: t('status_closed_won', locale), closed_lost: t('status_closed_lost', locale),
    postponed: t('status_postponed', locale), interested: t('status_interested', locale),
  };
}

export function getSourceLabel(locale: CrmLocale): Record<string, string> {
  return {
    manual: t('source_manual', locale), website: t('source_website', locale),
    facebook: t('source_facebook', locale), whatsapp: t('source_whatsapp', locale),
    google: t('source_google', locale), chatbot: t('source_chatbot', locale),
  };
}

export default translations;
