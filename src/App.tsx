import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Database,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  Link as LinkIcon,
  LogIn,
  Menu,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  X
} from 'lucide-react';
import { Attachment, FeedbackItem, ReaderStatus, VleLoginState } from './types';
import {
  INITIAL_COURSES,
  INITIAL_FEEDBACK,
  INITIAL_POSTS,
  QUICK_LINKS,
  TIMETABLE_EVENTS
} from './data/coursesData';
import DashboardOverview from './components/DashboardOverview';
import MaterialsFeed from './components/MaterialsFeed';
import WorkspaceArea from './components/WorkspaceArea';

type AppTab = 'dashboard' | 'modules' | 'reader' | 'feedback' | 'timetable' | 'links';

const tabItems: Array<{ id: AppTab; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Academic Hub', icon: LayoutDashboard },
  { id: 'modules', label: 'Module Feed', icon: BookOpen },
  { id: 'reader', label: 'Reader', icon: Database },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'links', label: 'Quick Links', icon: LinkIcon }
];

const FEEDBACK_CACHE_KEY = 'vle-workspace.feedback-cache.v1';

type FeedbackCachePayload = {
  feedback: FeedbackItem[];
  count: number;
  pages: number;
  syncedAt: string;
};

function readFeedbackCache(): FeedbackCachePayload | null {
  try {
    const raw = window.localStorage.getItem(FEEDBACK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeedbackCachePayload;
    return Array.isArray(parsed.feedback) ? parsed : null;
  } catch {
    return null;
  }
}

function writeFeedbackCache(cache: FeedbackCachePayload) {
  window.localStorage.setItem(FEEDBACK_CACHE_KEY, JSON.stringify(cache));
}

function formatCacheTime(value?: string) {
  if (!value) return 'unknown time';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses] = useState(INITIAL_COURSES);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [feedback, setFeedback] = useState<FeedbackItem[]>(() => readFeedbackCache()?.feedback || INITIAL_FEEDBACK);
  const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(
    INITIAL_POSTS.flatMap(post => post.attachments).find(attachment => attachment.status === 'reading') || null
  );
  const [loginState, setLoginState] = useState<VleLoginState>({
    connected: false,
    message: 'Demo data loaded. Connect your VLE session when the backend proxy is configured.'
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(() => {
    const cache = readFeedbackCache();
    return cache
      ? `Loaded ${cache.count} cached feedback records from ${formatCacheTime(cache.syncedAt)}.`
      : 'Demo feedback loaded.';
  });

  const allAttachments = useMemo(() => posts.flatMap(post => post.attachments), [posts]);

  const updateAttachment = (attachmentId: string, updater: (attachment: Attachment) => Attachment) => {
    setPosts(currentPosts =>
      currentPosts.map(post => ({
        ...post,
        attachments: post.attachments.map(attachment =>
          attachment.id === attachmentId ? updater(attachment) : attachment
        )
      }))
    );

    setActiveAttachment(current =>
      current?.id === attachmentId ? updater(current) : current
    );
  };

  const handleOpenAttachment = (attachment: Attachment) => {
    const nextAttachment =
      attachment.status === 'unread'
        ? { ...attachment, status: 'reading' as const, progress: Math.max(attachment.progress, 10) }
        : attachment;
    setActiveAttachment(nextAttachment);
    setActiveTab('reader');
    if (attachment.status === 'unread') {
      updateAttachment(attachment.id, current => ({ ...current, status: 'reading', progress: Math.max(current.progress, 10) }));
    }
  };

  const handleToggleBookmark = (attachmentId: string) => {
    updateAttachment(attachmentId, attachment => ({ ...attachment, isBookmarked: !attachment.isBookmarked }));
  };

  const handleUpdateProgress = (attachmentId: string, progress: number) => {
    const nextStatus: ReaderStatus = progress >= 100 ? 'completed' : progress > 0 ? 'reading' : 'unread';
    updateAttachment(attachmentId, attachment => ({
      ...attachment,
      progress,
      status: nextStatus
    }));
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginState({ connected: false, message: 'Connecting to VLE...' });

    try {
      const response = await fetch('/api/vle/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'VLE login failed.');
      }
      setLoginState({
        connected: true,
        username,
        message: payload.message || 'Connected to VLE session.'
      });
      setPassword('');
      setLoginOpen(false);
      await loadFeedbackCacheFromServer();
    } catch (error: any) {
      setLoginState({
        connected: false,
        username,
        message: error.message || 'Unable to connect to VLE.'
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const applyFeedbackPayload = (payload: any) => {
    const cache: FeedbackCachePayload = {
      feedback: payload.feedback || [],
      count: payload.count || 0,
      pages: payload.pages || 0,
      syncedAt: payload.syncedAt || new Date().toISOString()
    };
    setFeedback(cache.feedback);
    writeFeedbackCache(cache);
    return cache;
  };

  const loadFeedbackCacheFromServer = async () => {
    try {
      const response = await fetch('/api/vle/feedback');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load cached VLE feedback.');
      }
      const cache = applyFeedbackPayload(payload);
      const source = payload.cached ? 'server cache' : 'VLE';
      setFeedbackMessage(`Loaded ${cache.count} feedback records from ${source}. Last synced ${formatCacheTime(cache.syncedAt)}.`);
    } catch (error: any) {
      const cache = readFeedbackCache();
      if (cache) {
        setFeedback(cache.feedback);
        setFeedbackMessage(`Using local cache from ${formatCacheTime(cache.syncedAt)}. Click sync when VLE has updates.`);
        return;
      }
      setFeedbackMessage(error.message || 'Unable to load VLE feedback cache.');
    }
  };

  const syncFeedback = async (force = true) => {
    setFeedbackBusy(true);
    setFeedbackMessage(force ? 'Refreshing all feedback pages from VLE...' : 'Loading cached feedback...');
    try {
      const response = await fetch(`/api/vle/feedback${force ? '?force=1' : ''}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to sync VLE feedback.');
      }
      const cache = applyFeedbackPayload(payload);
      setFeedbackMessage(`${payload.cached ? 'Loaded cached' : 'Synced'} ${cache.count} feedback records across ${cache.pages} VLE page${cache.pages === 1 ? '' : 's'}. Last synced ${formatCacheTime(cache.syncedAt)}.`);
      setLoginState(current => ({
        ...current,
        connected: true,
        message: `${payload.cached ? 'Feedback loaded from cache' : 'Feedback synced'}: ${cache.count} records.`
      }));
    } catch (error: any) {
      setFeedbackMessage(error.message || 'Unable to sync VLE feedback.');
    } finally {
      setFeedbackBusy(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-vle-paper text-vle-ink flex font-sans antialiased">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-vle-panel border-r border-vle-line flex flex-col transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 px-5 border-b border-vle-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-vle-green text-white flex items-center justify-center">
              <GraduationCap size={19} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base leading-tight">VLE Workspace</h1>
              <p className="text-[10px] uppercase tracking-wider text-vle-muted font-bold">zycdu.net companion</p>
            </div>
          </div>
          <button className="md:hidden p-2 text-vle-muted" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {tabItems.map(item => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  selected ? 'bg-white border border-vle-line text-vle-green shadow-xs' : 'text-vle-muted hover:bg-white/70 hover:text-vle-ink'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-vle-line">
          <p className="text-[10px] uppercase tracking-widest text-vle-muted font-bold mb-3">Current Modules</p>
          <div className="space-y-1.5">
            {courses.filter(course => course.current).map(course => (
              <button
                key={course.id}
                onClick={() => {
                  setActiveTab('modules');
                  setSidebarOpen(false);
                }}
                className="w-full text-left text-xs text-vle-muted hover:text-vle-green flex gap-2"
              >
                <span className="font-mono font-bold min-w-16">{course.code}</span>
                <span className="truncate">{course.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-vle-line space-y-3">
          <div className="rounded-lg bg-white border border-vle-line p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${loginState.connected ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                <span className="text-xs font-bold">{loginState.connected ? 'VLE connected' : 'Demo mode'}</span>
              </div>
              <ShieldCheck size={15} className="text-vle-green" />
            </div>
            <p className="text-[11px] text-vle-muted mt-1 leading-relaxed">{loginState.message}</p>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="w-full px-3 py-2 rounded-lg bg-vle-green text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <LogIn size={14} />
            Connect VLE Login
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 md:pl-72 min-w-0">
        <header className="h-16 sticky top-0 z-20 border-b border-vle-line bg-vle-paper/95 backdrop-blur px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-vle-panel" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-vle-muted font-bold">Academic workspace</p>
              <p className="text-sm font-semibold">{currentDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncFeedback(true)}
              disabled={feedbackBusy}
              className="hidden sm:flex px-3 py-2 rounded-lg border border-vle-line bg-white text-xs font-semibold items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={13} />
              {feedbackBusy ? 'Syncing...' : 'Sync feedback'}
            </button>
            <a
              href="https://vle.zycdu.net"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-white border border-vle-line text-xs font-semibold flex items-center gap-2"
            >
              Original VLE
              <ExternalLink size={12} />
            </a>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              courses={courses}
              posts={posts}
              attachments={allAttachments}
              feedback={feedback}
              quickLinks={QUICK_LINKS}
              timetableEvents={TIMETABLE_EVENTS}
              onNavigate={setActiveTab}
              onOpenAttachment={handleOpenAttachment}
            />
          )}

          {activeTab === 'modules' && (
            <MaterialsFeed
              courses={courses}
              posts={posts}
              onOpenAttachment={handleOpenAttachment}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {activeTab === 'reader' && (
            <WorkspaceArea
              courses={courses}
              posts={posts}
              activeAttachment={activeAttachment}
              onOpenAttachment={handleOpenAttachment}
              onToggleBookmark={handleToggleBookmark}
              onUpdateProgress={handleUpdateProgress}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackWorkspace
              feedback={feedback}
              busy={feedbackBusy}
              message={feedbackMessage}
              onSync={syncFeedback}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableWorkspace events={TIMETABLE_EVENTS} />
          )}

          {activeTab === 'links' && (
            <QuickLinksWorkspace links={QUICK_LINKS} />
          )}
        </main>
      </div>

      {loginOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="w-full max-w-md bg-vle-paper rounded-xl border border-vle-line shadow-md p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold">Connect VLE</h2>
                <p className="text-xs text-vle-muted mt-1">Credentials are sent only to this local backend session and are not stored in browser storage.</p>
              </div>
              <button type="button" onClick={() => setLoginOpen(false)} className="p-1 text-vle-muted">
                <X size={18} />
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-vle-muted uppercase tracking-wider">Username</span>
              <input value={username} onChange={event => setUsername(event.target.value)} className="w-full rounded-lg border border-vle-line px-3 py-2 text-sm" autoComplete="username" required />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-vle-muted uppercase tracking-wider">Password</span>
              <input value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-vle-line px-3 py-2 text-sm" type="password" autoComplete="current-password" required />
            </label>
            <div className="rounded-lg bg-white border border-vle-line p-3 text-xs text-vle-muted leading-relaxed">
              The backend should exchange this for a server-side cookie jar, expose normalized modules/resources, and never return your password to the client.
            </div>
            <button disabled={loginBusy} className="w-full rounded-lg bg-vle-green text-white py-2.5 text-sm font-bold disabled:opacity-60">
              {loginBusy ? 'Connecting...' : 'Create local VLE session'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function FeedbackWorkspace({
  feedback,
  busy,
  message,
  onSync
}: {
  feedback: FeedbackItem[];
  busy: boolean;
  message: string;
  onSync: () => void;
}) {
  const [selectedId, setSelectedId] = useState(feedback[0]?.id);
  const selected = feedback.find(item => item.id === selectedId) || feedback[0];
  const grouped = feedback.reduce<Record<string, Record<string, typeof feedback>>>((acc, item) => {
    acc[item.semester] = acc[item.semester] || {};
    acc[item.semester][item.module] = acc[item.semester][item.module] || [];
    acc[item.semester][item.module].push(item);
    return acc;
  }, {});

  const averageScore = (items: FeedbackItem[]) => {
    const scores = items
      .map(item => item.totalScore)
      .filter((score): score is number => typeof score === 'number');
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div className="xl:col-span-5 space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">Assessment Feedback</h2>
          <p className="text-sm text-vle-muted">Rubrics, submitted work, provisional marks, and feedforward actions.</p>
        </div>
        <div className="bg-white rounded-xl border border-vle-line p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-vle-muted">VLE sync</p>
            <p className="text-sm text-vle-muted mt-1">{message}</p>
          </div>
          <button
            onClick={() => onSync()}
            disabled={busy}
            className="px-3 py-2 rounded-lg bg-vle-green text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            {busy ? 'Syncing' : 'Sync all'}
          </button>
        </div>
        {Object.entries(grouped).map(([semester, modules]) => (
          <div key={semester} className="bg-white rounded-xl border border-vle-line overflow-hidden">
            <div className="px-4 py-3 bg-vle-panel border-b border-vle-line text-xs font-bold uppercase tracking-wider text-vle-muted">{semester}</div>
            {Object.entries(modules).map(([moduleName, items]) => {
              const moduleAverage = averageScore(items);
              return (
                <div key={moduleName} className="border-b last:border-b-0 border-vle-line">
                  <div className="px-4 py-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{moduleName}</p>
                        <p className="text-xs text-vle-muted mt-1">{items.length} assessment{items.length === 1 ? '' : 's'} · Level {items[0]?.level}</p>
                      </div>
                      {moduleAverage !== null && (
                        <span className="rounded-md bg-vle-panel border border-vle-line px-2 py-1 text-xs font-mono font-bold text-vle-green">
                          avg {moduleAverage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-vle-panel/45">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full text-left px-4 py-3 border-t border-vle-line ${selected?.id === item.id ? 'bg-emerald-50' : 'hover:bg-white/70'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">{item.assessment}</p>
                          {typeof item.totalScore === 'number' && <span className="text-sm font-mono font-bold text-vle-green">{item.totalScore}%</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="xl:col-span-7 bg-white rounded-xl border border-vle-line p-5">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs text-vle-muted font-bold uppercase tracking-wider">{selected.semester} · {selected.module}</p>
                <h3 className="font-serif text-2xl font-bold mt-1">{selected.assessment}</h3>
              </div>
              <span className="rounded-lg bg-vle-panel border border-vle-line px-3 py-2 text-xs font-bold">
                {selected.provisional ? 'Provisional mark' : 'Confirmed'}
              </span>
            </div>
            {selected.submittedWork && (
              <a href={selected.submittedWork.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-vle-line bg-vle-panel p-3 text-sm font-semibold text-vle-green">
                Submitted work: {selected.submittedWork.title}
              </a>
            )}
            {selected.criteria ? (
              <div className="space-y-3">
                {selected.criteria.map(criterion => (
                  <article key={criterion.id} className="rounded-lg border border-vle-line p-4">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="font-bold text-sm">{criterion.title}</h4>
                      <span className="font-mono font-bold text-vle-green">{criterion.score}/{criterion.maxScore}</span>
                    </div>
                    <div className="h-2 bg-vle-panel rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-vle-green" style={{ width: `${(criterion.score / criterion.maxScore) * 100}%` }} />
                    </div>
                    <p className="text-sm text-vle-muted leading-relaxed mt-3">{criterion.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-vle-muted">Open this feedback in VLE to view rubric comments and submitted work.</p>
            )}
            <p className="text-xs text-vle-muted border-t border-vle-line pt-4">All marks are provisional until exam boards issue a transcript.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function TimetableWorkspace({ events }: { events: typeof TIMETABLE_EVENTS }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold">Timetable</h2>
        <p className="text-sm text-vle-muted">Weekly teaching blocks from the VLE timetable view.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {days.map(day => (
          <div key={day} className="bg-white rounded-xl border border-vle-line min-h-72">
            <div className="px-4 py-3 border-b border-vle-line bg-vle-panel">
              <p className="text-sm font-bold">{day}</p>
              <p className="text-xs text-vle-muted">{events.find(event => event.day === day)?.date}</p>
            </div>
            <div className="p-3 space-y-3">
              {events.filter(event => event.day === day).map(event => (
                <div key={event.id} className="rounded-lg border border-vle-line p-3 bg-emerald-50">
                  <p className="text-xs font-mono font-bold text-vle-green">{event.time}</p>
                  <p className="font-bold mt-1">{event.courseShortName}</p>
                  <p className="text-xs text-vle-muted">{event.group} · Room {event.room}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickLinksWorkspace({ links }: { links: typeof QUICK_LINKS }) {
  const labels: Record<(typeof links)[number]['category'], string> = {
    learning: 'Learning',
    research: 'Research',
    assessment: 'Assessment',
    'student-life': 'Student Life'
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold">Quick Links</h2>
        <p className="text-sm text-vle-muted">Useful VLE, library, Canvas, email, and academic support links grouped by intent.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(Object.keys(labels) as Array<keyof typeof labels>).map(category => (
          <div key={category} className="bg-white rounded-xl border border-vle-line overflow-hidden">
            <div className="px-4 py-3 bg-vle-panel border-b border-vle-line text-xs font-bold uppercase tracking-wider text-vle-muted">
              {labels[category]}
            </div>
            <div className="p-3 space-y-2">
              {links.filter(link => link.category === category).map(link => (
                <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className="block rounded-lg border border-vle-line p-3 hover:border-vle-green hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{link.label}</p>
                    <ExternalLink size={13} className="text-vle-muted" />
                  </div>
                  <p className="text-xs text-vle-muted mt-1 leading-relaxed">{link.description}</p>
                  <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wider text-vle-green">
                    {link.external ? 'External' : 'VLE'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
