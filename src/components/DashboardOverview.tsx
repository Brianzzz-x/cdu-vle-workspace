import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  MessageSquareText,
  Megaphone
} from 'lucide-react';
import { Attachment, Course, FeedbackItem, QuickLink, TimetableEvent, VlePost } from '../types';

interface DashboardOverviewProps {
  courses: Course[];
  posts: VlePost[];
  attachments: Attachment[];
  feedback: FeedbackItem[];
  quickLinks: QuickLink[];
  timetableEvents: TimetableEvent[];
  onNavigate: (tab: 'dashboard' | 'modules' | 'reader' | 'feedback' | 'timetable' | 'links') => void;
  onOpenAttachment: (attachment: Attachment) => void;
}

export default function DashboardOverview({
  courses,
  posts,
  attachments,
  feedback,
  quickLinks,
  timetableEvents,
  onNavigate,
  onOpenAttachment
}: DashboardOverviewProps) {
  const completed = attachments.filter(attachment => attachment.status === 'completed').length;
  const bookmarked = attachments.filter(attachment => attachment.isBookmarked).length;
  const latestPosts = posts.slice(0, 4);
  const todayEvents = timetableEvents.slice(0, 3);
  const latestFeedback = feedback.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="bg-white border border-vle-line rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vle-green font-bold">Stirling College, Chengdu University</p>
            <h2 className="font-serif text-3xl font-bold mt-2">Academic Hub</h2>
            <p className="text-sm text-vle-muted mt-2 max-w-2xl">
              A cleaner front door for VLE: current modules, weekly resources, PDF reading, assessment feedback, timetable, and useful academic services.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[320px]">
            <Metric label="Modules" value={String(courses.filter(course => course.current).length)} />
            <Metric label="Read" value={`${completed}/${attachments.length}`} />
            <Metric label="Saved" value={String(bookmarked)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <Panel
            title="Latest VLE Feed"
            icon={BookOpen}
            action="Open module feed"
            onAction={() => onNavigate('modules')}
          >
            <div className="space-y-3">
              {latestPosts.map(post => {
                const course = courses.find(item => item.id === post.courseId);
                return (
                  <article key={post.id} className="rounded-lg border border-vle-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-vle-green">{course?.code}</span>
                          <span className="text-[10px] uppercase tracking-wider text-vle-muted font-bold">{post.type}</span>
                          {post.week && <span className="text-[10px] uppercase tracking-wider text-vle-muted font-bold">Week {post.week}</span>}
                        </div>
                        <h3 className="font-bold mt-1">{post.title}</h3>
                        <p className="text-xs text-vle-muted mt-1">Submitted by {post.author} · {post.submittedAt}</p>
                      </div>
                      {post.type === 'announcement' ? <Megaphone size={18} className="text-vle-green" /> : <FileText size={18} className="text-vle-green" />}
                    </div>
                    {post.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.attachments.slice(0, 3).map(attachment => (
                          <button key={attachment.id} onClick={() => onOpenAttachment(attachment)} className="px-2.5 py-1 rounded-md bg-vle-panel border border-vle-line text-xs font-semibold hover:border-vle-green">
                            {attachment.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <Panel
            title="This Week"
            icon={CalendarDays}
            action="Open timetable"
            onAction={() => onNavigate('timetable')}
          >
            <div className="space-y-2">
              {todayEvents.map(event => (
                <div key={event.id} className="rounded-lg border border-vle-line p-3 bg-vle-panel">
                  <p className="text-xs font-mono font-bold text-vle-green">{event.day} · {event.time}</p>
                  <p className="font-bold mt-1">{event.courseShortName} {event.group}</p>
                  <p className="text-xs text-vle-muted">Room {event.room}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Feedback"
            icon={MessageSquareText}
            action="Review feedback"
            onAction={() => onNavigate('feedback')}
          >
            <div className="space-y-2">
              {latestFeedback.map(item => (
                <div key={item.id} className="rounded-lg border border-vle-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{item.assessment}</p>
                    {typeof item.totalScore === 'number' && <span className="font-mono text-xs font-bold text-vle-green">{item.totalScore}%</span>}
                  </div>
                  <p className="text-xs text-vle-muted mt-1">{item.module} · {item.semester}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Quick Academic Services"
        icon={LinkIcon}
        action="Open all links"
        onAction={() => onNavigate('links')}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {quickLinks.slice(0, 4).map(link => (
            <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className="rounded-lg border border-vle-line p-4 hover:border-vle-green hover:bg-emerald-50">
              <div className="flex items-center justify-between">
                <p className="font-bold">{link.label}</p>
                <ExternalLink size={14} className="text-vle-muted" />
              </div>
              <p className="text-xs text-vle-muted mt-2 leading-relaxed">{link.description}</p>
            </a>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-vle-line bg-vle-panel p-3">
      <p className="text-[10px] uppercase tracking-wider text-vle-muted font-bold">{label}</p>
      <p className="font-mono text-2xl font-bold mt-1 flex items-center gap-2">
        {value}
        {label === 'Read' && <CheckCircle size={16} className="text-vle-green" />}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  onAction,
  children
}: {
  title: string;
  icon: React.ElementType;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-vle-line rounded-xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-serif text-xl font-bold flex items-center gap-2">
          <Icon size={18} className="text-vle-green" />
          {title}
        </h3>
        <button onClick={onAction} className="text-xs font-bold text-vle-green flex items-center gap-1">
          {action}
          <ArrowRight size={13} />
        </button>
      </div>
      {children}
    </div>
  );
}
