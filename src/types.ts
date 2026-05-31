export type VleContentType = 'resource' | 'quiz' | 'announcement';

export type AttachmentType = 'pdf' | 'doc' | 'spreadsheet' | 'csv' | 'video' | 'archive' | 'link' | 'other';

export type ReaderStatus = 'unread' | 'reading' | 'completed';

export interface Course {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  level: string;
  current: boolean;
  color: string;
  url: string;
}

export interface Attachment {
  id: string;
  postId: string;
  title: string;
  type: AttachmentType;
  url: string;
  mimeType?: string;
  status: ReaderStatus;
  isBookmarked: boolean;
  progress: number;
}

export interface VlePost {
  id: string;
  courseId: string;
  type: VleContentType;
  title: string;
  author: string;
  submittedAt: string;
  body: string;
  url: string;
  week?: number;
  attachments: Attachment[];
  quizMeta?: {
    questions: number;
    attemptsAllowed: string;
    available: string;
    passRate: string;
    backwardsNavigation: string;
    startUrl: string;
  };
}

export interface FeedbackItem {
  id: string;
  semester: string;
  level: string;
  module: string;
  assessment: string;
  url: string;
  totalScore?: number;
  provisional: boolean;
  submittedWork?: {
    title: string;
    url: string;
  };
  criteria?: FeedbackCriterion[];
}

export interface FeedbackCriterion {
  id: string;
  title: string;
  comment: string;
  score: number;
  maxScore: number;
}

export interface QuickLink {
  id: string;
  label: string;
  description: string;
  href: string;
  category: 'learning' | 'research' | 'assessment' | 'student-life';
  external: boolean;
}

export interface TimetableEvent {
  id: string;
  day: string;
  date: string;
  time: string;
  courseShortName: string;
  group: string;
  room: string;
}

export interface VleLoginState {
  connected: boolean;
  username?: string;
  message?: string;
}
