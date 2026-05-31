import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  ClipboardList,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Megaphone,
  PlaySquare,
  Search,
  Table2
} from 'lucide-react';
import { Attachment, AttachmentType, Course, VleContentType, VlePost } from '../types';

interface MaterialsFeedProps {
  courses: Course[];
  posts: VlePost[];
  onOpenAttachment: (attachment: Attachment) => void;
  onToggleBookmark: (attachmentId: string) => void;
}

export default function MaterialsFeed({
  courses,
  posts,
  onOpenAttachment,
  onToggleBookmark
}: MaterialsFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | VleContentType>('all');

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return posts.filter(post => {
      const course = courses.find(item => item.id === post.courseId);
      const haystack = [
        post.title,
        post.body,
        post.author,
        course?.code,
        course?.name,
        ...post.attachments.map(attachment => attachment.title)
      ].join(' ').toLowerCase();

      const matchesQuery = !query || haystack.includes(query);
      const matchesCourse = selectedCourseId === 'all' || post.courseId === selectedCourseId;
      const matchesType = selectedType === 'all' || post.type === selectedType;
      return matchesQuery && matchesCourse && matchesType;
    });
  }, [courses, posts, searchQuery, selectedCourseId, selectedType]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">Module Feed</h2>
          <p className="text-sm text-vle-muted">Resources, quizzes, announcements, and attachments normalized from VLE.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 xl:w-[720px]">
          <div className="relative sm:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vle-muted" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search week, file, module..."
              className="w-full rounded-lg border border-vle-line bg-white pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select value={selectedCourseId} onChange={event => setSelectedCourseId(event.target.value)} className="rounded-lg border border-vle-line bg-white px-3 py-2 text-sm">
            <option value="all">All modules</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.code} · {course.name}</option>
            ))}
          </select>
          <select value={selectedType} onChange={event => setSelectedType(event.target.value as any)} className="rounded-lg border border-vle-line bg-white px-3 py-2 text-sm">
            <option value="all">All content</option>
            <option value="resource">Resources</option>
            <option value="quiz">Quizzes</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredPosts.map(post => {
          const course = courses.find(item => item.id === post.courseId);
          return (
            <article key={post.id} className="bg-white rounded-xl border border-vle-line overflow-hidden shadow-xs">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-vle-panel text-[10px] font-mono font-bold text-vle-green border border-vle-line">
                        {course?.code || 'VLE'}
                      </span>
                      {post.week && <span className="text-[10px] font-bold uppercase tracking-wider text-vle-muted">Week {post.week}</span>}
                      <ContentTypeBadge type={post.type} />
                    </div>
                    <h3 className="font-serif text-xl font-bold leading-tight">{post.title}</h3>
                    <p className="text-xs text-vle-muted">Submitted by {post.author} on {post.submittedAt}</p>
                  </div>
                  <a href={post.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-vle-line text-vle-muted hover:text-vle-green">
                    <ExternalLink size={15} />
                  </a>
                </div>

                <p className="text-sm text-vle-muted leading-relaxed">{post.body}</p>

                {post.quizMeta && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-lg bg-vle-panel border border-vle-line p-3">
                    <Meta label="Questions" value={String(post.quizMeta.questions)} />
                    <Meta label="Attempts" value={post.quizMeta.attemptsAllowed} />
                    <Meta label="Available" value={post.quizMeta.available} />
                    <Meta label="Pass rate" value={post.quizMeta.passRate} />
                    <Meta label="Back nav" value={post.quizMeta.backwardsNavigation} />
                  </div>
                )}

                {post.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-vle-muted font-bold">Attachments</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {post.attachments.map(attachment => (
                        <AttachmentRow
                          key={attachment.id}
                          attachment={attachment}
                          onOpenAttachment={onOpenAttachment}
                          onToggleBookmark={onToggleBookmark}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContentTypeBadge({ type }: { type: VleContentType }) {
  const config = {
    resource: { label: 'Resource', icon: FileText },
    quiz: { label: 'Quiz', icon: ClipboardList },
    announcement: { label: 'Announcement', icon: Megaphone }
  }[type];
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-vle-line px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-vle-muted">
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function AttachmentRow({
  attachment,
  onOpenAttachment,
  onToggleBookmark
}: {
  attachment: Attachment;
  onOpenAttachment: (attachment: Attachment) => void;
  onToggleBookmark: (attachmentId: string) => void;
}) {
  const Icon = getAttachmentIcon(attachment.type);
  const canPreview = attachment.type === 'pdf' || attachment.type === 'video';
  return (
    <div className="rounded-lg border border-vle-line bg-vle-paper p-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-white border border-vle-line flex items-center justify-center text-vle-green shrink-0">
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{attachment.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-vle-muted">{attachment.type}</span>
            <span className={`text-[10px] font-bold ${attachment.status === 'completed' ? 'text-emerald-700' : attachment.status === 'reading' ? 'text-amber-700' : 'text-vle-muted'}`}>
              {attachment.status}
            </span>
          </div>
        </div>
        <button onClick={() => onToggleBookmark(attachment.id)} className="p-1 text-vle-muted hover:text-vle-green">
          <Bookmark size={14} className={attachment.isBookmarked ? 'fill-vle-green text-vle-green' : ''} />
        </button>
      </div>
      {attachment.progress > 0 && (
        <div className="h-1.5 bg-white rounded-full overflow-hidden mt-3 border border-vle-line">
          <div className="h-full bg-vle-green" style={{ width: `${attachment.progress}%` }} />
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onOpenAttachment(attachment)}
          className="flex-1 rounded-lg bg-vle-green text-white text-xs font-bold py-2"
        >
          {canPreview ? 'Open in reader' : 'Inspect file'}
        </button>
        <a href={attachment.url} target="_blank" rel="noreferrer" className="px-3 rounded-lg border border-vle-line bg-white text-vle-muted flex items-center">
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-vle-muted font-bold">{label}</p>
      <p className="text-xs font-bold mt-0.5">{value}</p>
    </div>
  );
}

function getAttachmentIcon(type: AttachmentType) {
  switch (type) {
    case 'pdf':
    case 'doc':
      return FileText;
    case 'spreadsheet':
      return FileSpreadsheet;
    case 'csv':
      return Table2;
    case 'video':
      return PlaySquare;
    case 'archive':
      return FileArchive;
    default:
      return FileText;
  }
}
