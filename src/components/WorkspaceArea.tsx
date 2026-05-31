import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  MessageSquareText,
  RotateCcw
} from 'lucide-react';
import { Attachment, Course, VlePost } from '../types';

interface WorkspaceAreaProps {
  courses: Course[];
  posts: VlePost[];
  activeAttachment: Attachment | null;
  onOpenAttachment: (attachment: Attachment) => void;
  onToggleBookmark: (attachmentId: string) => void;
  onUpdateProgress: (attachmentId: string, progress: number) => void;
}

export default function WorkspaceArea({
  courses,
  posts,
  activeAttachment,
  onOpenAttachment,
  onToggleBookmark,
  onUpdateProgress
}: WorkspaceAreaProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Array<{ id: string; text: string; attachmentId: string }>>([]);

  const activePost = useMemo(
    () => posts.find(post => post.attachments.some(attachment => attachment.id === activeAttachment?.id)),
    [activeAttachment?.id, posts]
  );
  const activeCourse = courses.find(course => course.id === activePost?.courseId);
  const siblings = activePost?.attachments || [];

  if (!activeAttachment || !activePost) {
    return (
      <section className="max-w-2xl mx-auto bg-white border border-vle-line rounded-xl p-10 text-center space-y-4">
        <FileText size={42} className="mx-auto text-vle-green" />
        <h2 className="font-serif text-2xl font-bold">No attachment selected</h2>
        <p className="text-sm text-vle-muted">Choose a PDF or file from Module Feed to open the reader workspace.</p>
      </section>
    );
  }

  const localNotes = notes.filter(item => item.attachmentId === activeAttachment.id);

  const addNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    setNotes(current => [
      { id: `note-${Date.now()}`, text: note.trim(), attachmentId: activeAttachment.id },
      ...current
    ]);
    setNote('');
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div className="xl:col-span-8 space-y-4">
        <div className="bg-white border border-vle-line rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-vle-panel text-[10px] font-mono font-bold text-vle-green border border-vle-line">{activeCourse?.code}</span>
              <span className="text-[10px] uppercase tracking-wider text-vle-muted font-bold">{activePost.title}</span>
            </div>
            <h2 className="font-serif text-xl font-bold mt-2">{activeAttachment.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onToggleBookmark(activeAttachment.id)} className="p-2 rounded-lg border border-vle-line bg-white">
              <Bookmark size={14} className={activeAttachment.isBookmarked ? 'fill-vle-green text-vle-green' : ''} />
            </button>
            <a href={activeAttachment.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg border border-vle-line bg-white text-xs font-bold flex items-center gap-2">
              <ExternalLink size={14} />
              Open URL
            </a>
            <button onClick={() => onUpdateProgress(activeAttachment.id, 100)} className="px-3 py-2 rounded-lg bg-vle-green text-white text-xs font-bold flex items-center gap-2">
              <CheckCircle size={14} />
              Mark read
            </button>
          </div>
        </div>

        <div className="bg-vle-panel border border-vle-line rounded-xl min-h-[420px] p-6 flex items-center justify-center">
          <div className="bg-white border border-vle-line rounded-xl p-8 text-center max-w-xl w-full">
            <FileText size={44} className="mx-auto text-vle-green" />
            <p className="mt-4 text-[10px] uppercase tracking-widest text-vle-muted font-bold">{activeAttachment.type}</p>
            <h3 className="font-serif text-2xl font-bold mt-2 break-words">{activeAttachment.title}</h3>
            <p className="text-sm text-vle-muted mt-3 leading-relaxed">
              Preview is disabled because VLE files often require authenticated, cross-site access. Use the original URL so the file opens with your active VLE session.
            </p>
            <a href={activeAttachment.url} target="_blank" rel="noreferrer" className="inline-flex mt-5 px-4 py-2 rounded-lg bg-vle-green text-white text-sm font-bold items-center gap-2">
              <Download size={15} />
              Open original file
            </a>
            <div className="mt-5 rounded-lg bg-vle-panel border border-vle-line p-3 text-left">
              <p className="text-[10px] uppercase tracking-wider text-vle-muted font-bold">File URL</p>
              <a href={activeAttachment.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-vle-green break-all">
                {activeAttachment.url}
              </a>
            </div>
          </div>
        </div>
      </div>

      <aside className="xl:col-span-4 space-y-4">
        <div className="bg-white border border-vle-line rounded-xl p-4">
          <h3 className="font-bold">Resource context</h3>
          <p className="text-xs text-vle-muted mt-1">Submitted by {activePost.author} on {activePost.submittedAt}</p>
          <p className="text-sm text-vle-muted leading-relaxed mt-3">{activePost.body}</p>
          <div className="flex gap-2 mt-4">
            <a href={activePost.url} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-lg border border-vle-line text-xs font-bold flex items-center justify-center gap-2">
              VLE post
              <ExternalLink size={13} />
            </a>
            <a href={activeAttachment.url} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-lg border border-vle-line text-xs font-bold flex items-center justify-center gap-2">
              File URL
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="bg-white border border-vle-line rounded-xl p-4">
          <h3 className="font-bold">Sibling attachments</h3>
          <div className="space-y-2 mt-3">
            {siblings.map(attachment => (
              <button
                key={attachment.id}
                onClick={() => onOpenAttachment(attachment)}
                className={`w-full text-left rounded-lg border px-3 py-2 ${attachment.id === activeAttachment.id ? 'border-vle-green bg-emerald-50' : 'border-vle-line hover:bg-vle-panel'}`}
              >
                <p className="text-sm font-bold truncate">{attachment.title}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] uppercase tracking-wider text-vle-muted font-bold">
                  <span>{attachment.type}</span>
                  <span>{attachment.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-vle-line rounded-xl p-4">
          <h3 className="font-bold flex items-center gap-2">
            <MessageSquareText size={16} />
            Reader notes
          </h3>
          <form onSubmit={addNote} className="mt-3 space-y-2">
            <textarea value={note} onChange={event => setNote(event.target.value)} rows={3} placeholder="Write a local note for this attachment..." className="w-full rounded-lg border border-vle-line p-3 text-sm" />
            <button className="w-full rounded-lg bg-vle-green text-white text-xs font-bold py-2">Save note</button>
          </form>
          <div className="space-y-2 mt-3">
            {localNotes.length === 0 ? (
              <p className="text-xs text-vle-muted">No local notes yet.</p>
            ) : (
              localNotes.map(item => (
                <div key={item.id} className="rounded-lg bg-vle-panel border border-vle-line p-3 text-sm">{item.text}</div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-vle-line rounded-xl p-4">
          <h3 className="font-bold">Reading progress</h3>
          <div className="h-2 bg-vle-panel rounded-full overflow-hidden mt-3 border border-vle-line">
            <div className="h-full bg-vle-green" style={{ width: `${activeAttachment.progress}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[25, 50, 100].map(value => (
              <button key={value} onClick={() => onUpdateProgress(activeAttachment.id, value)} className="rounded-lg border border-vle-line py-2 text-xs font-bold">
                {value === 100 ? 'Done' : `${value}%`}
              </button>
            ))}
          </div>
          <button onClick={() => onUpdateProgress(activeAttachment.id, 0)} className="w-full mt-2 rounded-lg border border-vle-line py-2 text-xs font-bold flex items-center justify-center gap-2">
            <RotateCcw size={13} />
            Reset progress
          </button>
        </div>
      </aside>
    </section>
  );
}
