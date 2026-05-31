import { Attachment, Course, FeedbackItem, QuickLink, TimetableEvent, VlePost } from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'cscu9b3',
    code: 'CSCU9B3',
    name: 'Database Principles and Applications',
    academicYear: '2025-26',
    level: 'Year 2',
    current: true,
    color: 'emerald',
    url: 'https://vle.zycdu.net/2025-26/year-2/database-principles-and-applicationscscu9b3'
  },
  {
    id: 'cscu9b4',
    code: 'CSCU9B4',
    name: 'NoSQL Databases & Data Warehousing',
    academicYear: '2025-26',
    level: 'Year 2',
    current: true,
    color: 'indigo',
    url: 'https://vle.zycdu.net/2025-26/year-2/nosql-databases-data-warehousing-cscu9b4'
  },
  {
    id: 'cscu9s2',
    code: 'CSCU9S2',
    name: 'Intro to Data Science',
    academicYear: '2025-26',
    level: 'Year 2',
    current: true,
    color: 'rose',
    url: 'https://vle.zycdu.net/2025-26/year-2/intro-data-science-cscu9s2'
  },
  {
    id: 'matu9d2',
    code: 'MATU9D2',
    name: 'Practical Statistics',
    academicYear: '2025-26',
    level: 'Year 2',
    current: true,
    color: 'amber',
    url: 'https://vle.zycdu.net/2025-26/year-2/practical-statistics-matu9d2'
  },
  {
    id: 'cscu9m3',
    code: 'CSCU9M3',
    name: 'Scripting for Data Science',
    academicYear: '2025-26',
    level: 'Year 2',
    current: true,
    color: 'cyan',
    url: 'https://vle.zycdu.net/2025-26/year-2/scripting-data-science-cscu9m3'
  },
  {
    id: 'spsu813',
    code: 'SPSU813',
    name: 'Understanding Global Sport',
    academicYear: '2025-26',
    level: 'Year 2',
    current: true,
    color: 'slate',
    url: 'https://vle.zycdu.net/2025-26/year-2/spsu813-understanding-global-sport'
  },
  {
    id: 'announcements',
    code: 'ANN',
    name: 'Stirling College Announcements',
    academicYear: '2025-26',
    level: 'Year 4',
    current: true,
    color: 'stone',
    url: 'https://vle.zycdu.net/2025-26/year-4/stirling-college-announcements'
  }
];

const attach = (
  postId: string,
  suffix: string,
  title: string,
  type: Attachment['type'],
  url: string,
  status: Attachment['status'] = 'unread',
  progress = 0
): Attachment => ({
  id: `${postId}-${suffix}`,
  postId,
  title,
  type,
  url,
  status,
  isBookmarked: false,
  progress
});

export const INITIAL_POSTS: VlePost[] = [
  {
    id: 'post-week12-review',
    courseId: 'cscu9s2',
    type: 'resource',
    title: 'CSCU9S2 Week 12: Exam Review and Mock Exam (Q2)',
    author: 'Zaid Hasan',
    submittedAt: '2026-05-29 12:45',
    week: 12,
    url: 'https://vle.zycdu.net/resource/2026-05/cscu9s2-week-12-exam-review-and-mock-exam-q2',
    body: 'The final week completes exam preparation and viva sessions. Lecture Part 1 covers exam review; Part 2 is Mock Exam Q2. Final exam reminder: 9 June 2026, 14:00-16:00 Beijing Time.',
    attachments: [
      attach('post-week12-review', 'review', 'CSCU9S2_Week12_Review.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/CSCU9S2_Week12_Review_1.pdf', 'reading', 35),
      attach('post-week12-review', 'plan', 'DS-Skills-Development-Plan.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/DS-Skills-Development-Plan.pdf')
    ]
  },
  {
    id: 'post-week11-review',
    courseId: 'cscu9s2',
    type: 'resource',
    title: 'CSCU9S2 Week 11: Exam Review, Mock Exam (Q1), and Viva Sessions',
    author: 'Zaid Hasan',
    submittedAt: '2026-05-22 09:44',
    week: 11,
    url: 'https://vle.zycdu.net/resource/2026-05/cscu9s2-week-11-exam-review-mock-exam-q1-and-viva-sessions',
    body: 'Important week combining viva sessions and exam review lectures. Students should confirm group and session time slot, and review lecture slides from Weeks 1 to 10.',
    attachments: [
      attach('post-week11-review', 'review', 'CSCU9S2_Week11_Review.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/CSCU9S2_Week11_Review_0.pdf', 'completed', 100)
    ]
  },
  {
    id: 'quiz-week10',
    courseId: 'cscu9s2',
    type: 'quiz',
    title: 'Week 10 Quiz - Prescriptive Analytics and Data Applications',
    author: 'Zaid Hasan',
    submittedAt: '2026-05-21 08:57',
    week: 10,
    url: 'https://vle.zycdu.net/quiz/15558/week-10-quiz-prescriptive-analytics-and-data-applications',
    body: 'Ten questions covering prescriptive analytics, optimisation, computer simulation, and ethics/legal responsibilities under GDPR.',
    attachments: [],
    quizMeta: {
      questions: 10,
      attemptsAllowed: 'Unlimited',
      available: 'Always',
      passRate: '75%',
      backwardsNavigation: 'Allowed',
      startUrl: 'https://vle.zycdu.net/node/15558/take'
    }
  },
  {
    id: 'post-week10-prescriptive',
    courseId: 'cscu9s2',
    type: 'resource',
    title: 'CSCU9S2 Week 10: Prescriptive Analytics and Data Applications',
    author: 'Zaid Hasan',
    submittedAt: '2026-05-15 09:10',
    week: 10,
    url: 'https://vle.zycdu.net/resource/2026-05/cscu9s2-week-10-prescriptive-analytics-and-data-applications',
    body: 'Lecture covers descriptive, predictive, and prescriptive analytics, optimisation, simulation, deployment, model decay, and automated decision-making ethics.',
    attachments: [
      attach('post-week10-prescriptive', 'lecture', 'CSCU9S2-Week10-Prescriptive-Analytics.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/CSCU9S2-Week10-Prescriptive-Analytics_0.pdf', 'reading', 65),
      attach('post-week10-prescriptive', 'workshop', 'CSCU9S2_Week10_Workshop.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/CSCU9S2_Week10_Workshop.pdf'),
      attach('post-week10-prescriptive', 'practical', 'CSCU9S2_Practical6.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/CSCU9S2_Practical6.pdf'),
      attach('post-week10-prescriptive', 'data', 'telco_churn_raw.csv', 'csv', 'https://vle.zycdu.net/system/files/resource/2026-05/telco_churn_raw.csv')
    ]
  },
  {
    id: 'post-stat-week12',
    courseId: 'matu9d2',
    type: 'resource',
    title: 'Week 12 Reviewing session',
    author: 'James Ren',
    submittedAt: '2026-05-31 10:17',
    week: 12,
    url: 'https://vle.zycdu.net/resource/2026-05/week-12-reviewing-session',
    body: 'Reviewing session resources for Practical Statistics.',
    attachments: [
      attach('post-stat-week12', 'week12', 'WEEK 12.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/WEEK%2012.pdf'),
      attach('post-stat-week12', 'formula', 'MATU9D2 Formula Sheet.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/MATU9D2%20Formula%20Sheet.pdf', 'completed', 100)
    ]
  },
  {
    id: 'post-stat-week11',
    courseId: 'matu9d2',
    type: 'resource',
    title: 'Week 11 Multiple linear regression',
    author: 'James Ren',
    submittedAt: '2026-05-21 11:06',
    week: 11,
    url: 'https://vle.zycdu.net/resource/2026-05/week-11-multiple-linear-regression',
    body: 'Multiple linear regression lecture and practical exercise files.',
    attachments: [
      attach('post-stat-week11', 'lecture', 'WEEK 11.pdf', 'pdf', 'https://vle.zycdu.net/system/files/resource/2026-05/WEEK%2011.pdf'),
      attach('post-stat-week11', 'doc', 'Week 11 Practical excercises.docx', 'doc', 'https://vle.zycdu.net/system/files/resource/2026-05/Week%2011%20Practical%20excercises.docx'),
      attach('post-stat-week11', 'csv', 'bp.csv', 'csv', 'https://vle.zycdu.net/system/files/resource/2026-05/bp.csv')
    ]
  },
  {
    id: 'announcement-canvas',
    courseId: 'announcements',
    type: 'announcement',
    title: 'Canvas Page',
    author: 'Pedro Miguel',
    submittedAt: '2025-09-06 10:55',
    url: 'https://vle.zycdu.net/announcement/2025-09/canvas-page',
    body: 'Canvas will be used as the primary source of information for this module, as well as to upload assignments and exams. Try your Canvas login at https://canvas.stir.ac.uk.',
    attachments: []
  },
  {
    id: 'announcement-deadlines',
    courseId: 'announcements',
    type: 'announcement',
    title: 'Important dates and submission requirements',
    author: 'Mira Peng',
    submittedAt: '2024-12-03 10:30',
    url: 'https://vle.zycdu.net/announcement/2024-12/important-dates-and-submission-requirements',
    body: 'Submission deadlines and naming requirements for Reflective Form and Group Presentation PPT.',
    attachments: []
  }
];

export const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-global-sport-essay',
    semester: 'Autumn 2025',
    level: '2',
    module: 'Understanding Global Sport',
    assessment: '1000 Word Essay',
    url: 'https://vle.zycdu.net/emark/mark/105234',
    totalScore: 66,
    provisional: true,
    submittedWork: {
      title: 'Understand global sports Essay_Brian_202416801503.doc',
      url: 'https://vle.zycdu.net/emark/submittedwork/105234/202416801503%252FUnderstand%2Bglobal%2Bsports%2BEssay_Brian_202416801503.doc'
    },
    criteria: [
      {
        id: 'role-purpose',
        title: 'Role and purpose of a governing body',
        comment: 'Clear and accurate overview. Future work should explicitly link stated values and governance principles to the later critique.',
        score: 14,
        maxScore: 20
      },
      {
        id: 'issue-controversy',
        title: 'Key issue or controversy',
        comment: 'Strong framing of corruption as structural governance problem. Add more concrete case examples and timelines.',
        score: 20,
        maxScore: 30
      },
      {
        id: 'critical-analysis',
        title: 'Critical analysis of the response',
        comment: 'Good critical engagement. Deepen theoretical links to globalisation, regulatory autonomy, and transnational governance.',
        score: 19,
        maxScore: 30
      },
      {
        id: 'academic-style',
        title: 'Academic writing and presentation',
        comment: 'Mostly coherent academic tone. Proofread grammar and apply stricter APA formatting.',
        score: 13,
        maxScore: 20
      }
    ]
  },
  {
    id: 'fb-group-digi',
    semester: 'Autumn 2025',
    level: '2',
    module: 'Understanding Global Sport',
    assessment: 'Group Digi Essay',
    url: 'https://vle.zycdu.net/emark/mark/102678',
    totalScore: 72,
    provisional: true
  },
  {
    id: 'fb-general-english-reading',
    semester: 'Spring 2025',
    level: '1',
    module: 'General English',
    assessment: 'General English Reading Exam Spring 2024-25',
    url: 'https://vle.zycdu.net/emark/mark/88564',
    provisional: true
  },
  {
    id: 'fb-ui-java',
    semester: 'Spring 2025',
    level: '1',
    module: 'Programming and User Interface Design',
    assessment: 'Java Programming Assignment',
    url: 'https://vle.zycdu.net/emark/mark/83126',
    provisional: true
  }
];

export const QUICK_LINKS: QuickLink[] = [
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'College-wide notices, Canvas instructions, and submission requirements.',
    href: 'https://vle.zycdu.net/announcements',
    category: 'learning',
    external: false
  },
  {
    id: 'feedback',
    label: 'Assessment feedback',
    description: 'Rubric comments, submitted work, provisional scores, and feedforward.',
    href: 'https://vle.zycdu.net/user/2301/feedback',
    category: 'assessment',
    external: false
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Weekly timetable with teacher, room, group, and date filters.',
    href: 'https://vle.zycdu.net/sis/timetable',
    category: 'student-life',
    external: false
  },
  {
    id: 'canvas',
    label: 'Canvas',
    description: 'Stirling Canvas for module information, exams, and submissions.',
    href: 'https://canvas.stir.ac.uk',
    category: 'learning',
    external: true
  },
  {
    id: 'cdu-library',
    label: 'CDU Library',
    description: 'Chengdu University library resources.',
    href: 'https://lib.cdu.edu.cn/',
    category: 'research',
    external: true
  },
  {
    id: 'library-search',
    label: 'Stirling library search',
    description: 'Search Stirling books, articles, and databases.',
    href: 'https://librarysearch.stir.ac.uk/',
    category: 'research',
    external: true
  },
  {
    id: 'referencing',
    label: 'Referencing guide',
    description: 'Stirling referencing rules and citation guidance.',
    href: 'https://libguides.stir.ac.uk/Referencing/',
    category: 'research',
    external: true
  },
  {
    id: 'email',
    label: 'Student email',
    description: 'CDU student mailbox.',
    href: 'https://mail.stu.cdu.edu.cn/',
    category: 'student-life',
    external: true
  }
];

export const TIMETABLE_EVENTS: TimetableEvent[] = [
  { id: 'mon-ndadw', day: 'Monday', date: '2026-06-01', time: '08:30-09:15', courseShortName: 'NDaDW', group: '2DS1', room: '14-308' },
  { id: 'mon-ids', day: 'Monday', date: '2026-06-01', time: '14:00-14:45', courseShortName: 'IDS', group: '2DS1', room: '14-404' },
  { id: 'tue-ndadw', day: 'Tuesday', date: '2026-06-02', time: '08:30-09:15', courseShortName: 'NDaDW', group: '2DS1', room: '14-304' },
  { id: 'wed-ps', day: 'Wednesday', date: '2026-06-03', time: '09:20-10:05', courseShortName: 'PS', group: '2DS1', room: '13-317' },
  { id: 'thu-ps', day: 'Thursday', date: '2026-06-04', time: '11:25-12:10', courseShortName: 'PS', group: '2DS1', room: '14-408' },
  { id: 'fri-ps', day: 'Friday', date: '2026-06-05', time: '10:35-11:20', courseShortName: 'PS', group: '2DS1', room: '14-302' },
  { id: 'fri-ids', day: 'Friday', date: '2026-06-05', time: '17:05-18:50', courseShortName: 'IDS', group: '2DS1', room: '14-404' }
];
