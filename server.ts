import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import type { FeedbackItem } from './src/types';
import { parseFeedbackDetail, parseFeedbackList } from './src/lib/vleFeedbackParser';

// Load environmental variables
dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3000);

app.use(express.json());

type VleSession = {
  username: string;
  createdAt: number;
  cookies: string[];
  feedbackCache?: VleFeedbackCache;
};

type VleFeedbackCache = {
  feedback: FeedbackItem[];
  count: number;
  pages: number;
  syncedAt: string;
};

const vleSessions = new Map<string, VleSession>();
const vleFeedbackCachesByUsername = new Map<string, VleFeedbackCache>();

const VLE_BASE_URL = process.env.VLE_BASE_URL || 'https://vle.zycdu.net';

function makeSessionId() {
  return `vle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function parseSetCookie(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const rawCookies = typeof getSetCookie === 'function' ? getSetCookie.call(headers) : [];
  const fallback = headers.get('set-cookie');
  const values = rawCookies.length > 0 ? rawCookies : fallback ? fallback.split(/,(?=[^;,]+=)/) : [];
  return values.map(cookie => cookie.split(';')[0]);
}

function mergeCookies(existing: string[], incoming: string[]) {
  const cookieMap = new Map<string, string>();
  [...existing, ...incoming].forEach(cookie => {
    const name = cookie.split('=')[0];
    if (name) cookieMap.set(name, cookie);
  });
  return [...cookieMap.values()];
}

function absoluteVleUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, VLE_BASE_URL).toString();
}

function getVleSession(req: express.Request) {
  const cookieHeader = req.headers.cookie || '';
  const sessionId = cookieHeader.match(/vle_workspace_session=([^;]+)/)?.[1];
  return sessionId ? { sessionId, session: vleSessions.get(sessionId) } : { sessionId: undefined, session: undefined };
}

async function fetchVle(pathOrUrl: string, init: RequestInit = {}, cookies: string[] = []) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${VLE_BASE_URL}${pathOrUrl}`;
  const headers = new Headers(init.headers || {});
  if (cookies.length > 0) {
    headers.set('cookie', cookies.join('; '));
  }
  headers.set('user-agent', 'VLE Academic Workspace local proxy');
  return fetch(url, {
    ...init,
    headers,
    redirect: 'manual'
  });
}

async function fetchVleForSession(session: VleSession, pathOrUrl: string, init: RequestInit = {}) {
  const response = await fetchVle(pathOrUrl, init, session.cookies);
  session.cookies = mergeCookies(session.cookies, parseSetCookie(response.headers));
  return response;
}

async function fetchVleTextForSession(session: VleSession, pathOrUrl: string) {
  const response = await fetchVleForSession(session, pathOrUrl);
  const location = response.headers.get('location');
  if (response.status >= 300 && response.status < 400 && location) {
    return fetchVleTextForSession(session, absoluteVleUrl(location));
  }

  const html = await response.text();
  return {
    html,
    url: response.url || absoluteVleUrl(pathOrUrl),
    status: response.status
  };
}

// Lazy-initialized GoogleGenAI SDK to prevent app crash if keys are missing
let googleAiClient: GoogleGenAI | null = null;

function getGoogleAi(): GoogleGenAI {
  if (!googleAiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it via the Secrets panel.');
    }
    googleAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return googleAiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Create a local server-side VLE session.
 *
 * This endpoint intentionally does not persist credentials. It is a bridge for a
 * future VLE scraper: credentials are exchanged for cookies held in memory, then
 * later endpoints use those cookies to fetch modules/resources.
 */
app.post('/api/vle/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const loginPage = await fetchVle('/user/login');
    const loginHtml = await loginPage.text();
    const initialCookies = parseSetCookie(loginPage.headers);

    const formBuildMatch = loginHtml.match(/name="form_build_id"\s+value="([^"]+)"/);
    const formIdMatch = loginHtml.match(/name="form_id"\s+value="([^"]+)"/);
    const formTokenMatch = loginHtml.match(/name="form_token"\s+value="([^"]+)"/);

    const form = new URLSearchParams();
    form.set('name', username);
    form.set('pass', password);
    form.set('op', 'Log in');
    if (formBuildMatch?.[1]) form.set('form_build_id', formBuildMatch[1]);
    if (formIdMatch?.[1]) form.set('form_id', formIdMatch[1]);
    if (formTokenMatch?.[1]) form.set('form_token', formTokenMatch[1]);

    const loginResponse = await fetchVle('/user/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'referer': `${VLE_BASE_URL}/user/login`
      },
      body: form.toString()
    }, initialCookies);

    const responseCookies = [...initialCookies, ...parseSetCookie(loginResponse.headers)];
    const location = loginResponse.headers.get('location') || '';
    const loginSucceeded = loginResponse.status >= 300 && loginResponse.status < 400 && !location.includes('/user/login');

    if (!loginSucceeded) {
      res.status(401).json({
        error: 'VLE did not accept the login. Check credentials or the login form mapping.'
      });
      return;
    }

    const sessionId = makeSessionId();
    const feedbackCache = vleFeedbackCachesByUsername.get(username);
    vleSessions.set(sessionId, {
      username,
      createdAt: Date.now(),
      cookies: responseCookies,
      feedbackCache
    });

    res.cookie('vle_workspace_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 6
    });
    res.json({
      connected: true,
      username,
      message: 'VLE session created in local backend memory.'
    });
  } catch (error: any) {
    console.error('VLE login error:', error);
    res.status(502).json({
      error: error.message || 'Unable to reach VLE login endpoint.'
    });
  }
});

app.get('/api/vle/status', (req, res) => {
  const { session } = getVleSession(req);
  res.json({
    connected: Boolean(session),
    username: session?.username,
    createdAt: session?.createdAt
  });
});

app.get('/api/vle/modules', async (req, res) => {
  res.status(501).json({
    error: 'Module scraping is not implemented yet.',
    next: 'Use the server-side session cookie to fetch /user/{id}/modules and normalize rows into Course objects.'
  });
});

app.get('/api/vle/feedback', async (req, res) => {
  try {
    const { session } = getVleSession(req);
    if (!session) {
      res.status(401).json({ error: 'Connect VLE login before syncing feedback.' });
      return;
    }

    const forceRefresh = req.query.force === '1' || req.query.force === 'true';
    if (session.feedbackCache && !forceRefresh) {
      res.json({
        ...session.feedbackCache,
        cached: true
      });
      return;
    }

    const feedbackPages = new Set<string>([absoluteVleUrl('/feedback')]);
    const visitedPages = new Set<string>();
    const feedbackByUrl = new Map<string, FeedbackItem>();
    const maxPages = 20;

    while (feedbackPages.size > visitedPages.size && visitedPages.size < maxPages) {
      const nextUrl = [...feedbackPages].find(url => !visitedPages.has(url));
      if (!nextUrl) break;
      visitedPages.add(nextUrl);

      const { html, url, status } = await fetchVleTextForSession(session, nextUrl);
      if (status >= 400 || /name="pass"|\/user\/login|Log in/i.test(html)) {
        res.status(401).json({ error: 'VLE session expired. Please reconnect VLE login.' });
        return;
      }

      const parsed = parseFeedbackList(html, url, VLE_BASE_URL);
      parsed.pageUrls.forEach(pageUrl => feedbackPages.add(pageUrl));
      parsed.items.forEach(item => {
        feedbackByUrl.set(item.url, item);
      });
    }

    const feedback = [...feedbackByUrl.values()];
    const hydratedFeedback: FeedbackItem[] = [];

    for (const item of feedback) {
      try {
        const { html } = await fetchVleTextForSession(session, item.url);
        const detail = parseFeedbackDetail(html, item.url, VLE_BASE_URL);
        hydratedFeedback.push({ ...item, ...detail, id: item.id, url: item.url });
      } catch (error) {
        console.warn(`Unable to hydrate feedback ${item.url}:`, error);
        hydratedFeedback.push(item);
      }
    }

    const feedbackCache: VleFeedbackCache = {
      feedback: hydratedFeedback,
      count: hydratedFeedback.length,
      pages: visitedPages.size,
      syncedAt: new Date().toISOString()
    };

    session.feedbackCache = feedbackCache;
    vleFeedbackCachesByUsername.set(session.username, feedbackCache);

    res.json({
      ...feedbackCache,
      cached: false
    });
  } catch (error: any) {
    console.error('VLE feedback sync error:', error);
    res.status(502).json({
      error: error.message || 'Unable to sync VLE feedback.'
    });
  }
});

/**
 * Summarize and tag materials using Gemini
 */
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { title, description, category, courseCode, fileType } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Material title is required' });
      return;
    }

    const ai = getGoogleAi();

    const prompt = `
      You are an expert academic advisor and study assistant at Stirling College, Chengdu University.
      Please analyze the following academic course material profile and provide a structured learning outline:
      
      Course Code: ${courseCode || 'Unknown'}
      Material Title: ${title}
      Description/Snippet: ${description || 'No description provided.'}
      Category: ${category || 'Learning Material'}
      Format Type: ${fileType || 'PDF'}
      
      Generate:
      1. A professional, highly scannable, engaging academic summary (max 4 sentences) outlining the core learning objectives.
      2. 3 crucial academic bullet takeaways from the material.
      3. 2 challenge self-assessment questions that a student can reflect on to test their memory of this material.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a warm, highly motivating Stirling University joint education academic tutoring assistant. Be educational, clean, and focus purely on high-value academic concepts.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Clear, concise synthesis of the material topic and core academic goals.'
            },
            takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of 3 central instructional bullet points.'
            },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A list of exactly 2 diagnostic questions.'
            }
          },
          required: ['summary', 'takeaways', 'questions']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty output received from Gemini API');
    }

    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini Summarize Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate summary using Gemini AI.',
      isConfigError: !process.env.GEMINI_API_KEY
    });
  }
});

/**
 * Side-by-side Chat Companion Q&A on materials
 */
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, materialTitle, materialCategory, courseCode } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const ai = getGoogleAi();

    // Map message list to format required, injecting context instruction in the first system turn or prepending
    const currentM = messages[messages.length - 1];

    const contextPrompt = `
      You are an interactive AI Study Companion at Stirling College, Chengdu University.
      The student is currently viewing the following material:
      - Course: ${courseCode || 'Joint VLE Syllabus'}
      - Title: ${materialTitle}
      - Category: ${materialCategory}
      
      Respond directly to their last question. Keep answers compact, exceptionally educational, and formatted with clean paragraphs or bullet points:
      
      Student question: "${currentM.content}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: 'You are an elite, approachable university tutor. Encourage academic honesty, promote active retrieval practice, and use LaTeX notation or clean formatted formulas where needed. Keep explanations precise (under 250 words) to fit the reader workspace side-pane.'
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to chat with study assistant.',
      isConfigError: !process.env.GEMINI_API_KEY
    });
  }
});

// ----------------------------------------------------
// BOOTSTRAP EXPRESS SERVER + VITE MIDDLEWARE
// ----------------------------------------------------
export async function startServer(options: { port?: number; host?: string } = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? '0.0.0.0';

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    // Mount Vite dev server middlewares
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app.listen(port, host, () => {
    console.log(`VLE Academic Workspace server running on http://${host}:${port}`);
  });
}

if (process.env.VLE_SERVER_STANDALONE !== 'false') {
  startServer().catch((err) => {
    console.error('Failure starting fullstack server:', err);
  });
}
