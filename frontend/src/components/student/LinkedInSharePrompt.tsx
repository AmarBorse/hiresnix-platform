// src/components/student/LinkedInSharePrompt.tsx
// Shown after the intern downloads their offer letter, and when they try to open locked
// certificates. Two steps: share the offer letter on LinkedIn (tagging Hiresnix), then paste
// the post link and a screenshot of the post. The server reads the screenshot and unlocks the
// certificates when it shows the intern's name and role (see backend/utils/postOcr.js).

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { X, Copy, Check, Upload, Loader2, Linkedin, NotebookPen, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import client from '../../api/client';

const HIRESNIX_LINKEDIN = 'https://www.linkedin.com/company/hiresnix';

/** Fired after a submission so every certificate box on the page refreshes at once. */
export const CERT_UNLOCK_EVENT = 'hx:cert-unlock-changed';
const announce = () => { try { window.dispatchEvent(new Event(CERT_UNLOCK_EVENT)); } catch { /* old browser */ } };

type Props = {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
  domain?: string;           // e.g. "Data Science"
  startDate?: string;        // kept for older callers; not used any more
  rejectedNote?: string;     // admin's reason if an earlier proof was not valid
};

/**
 * Students often copy the link while logged out, which gives a LinkedIn login link
 * (…/login/?session_redirect=<the real post link>). Pull the real post link out of it.
 */
export function cleanLinkedinLink(raw: string): string {
  let url = raw.trim();
  // "lnkd.in/p/xxxx" or "www.linkedin.com/posts/…" pasted without https://
  if (url && !/^[a-z]+:\/\//i.test(url)) url = `https://${url.replace(/^\/+/, '')}`;
  for (let i = 0; i < 3; i++) {
    try {
      const u = new URL(url);
      const inner = u.searchParams.get('session_redirect') || u.searchParams.get('redirect') || u.searchParams.get('url');
      if (inner && /linkedin\.com|lnkd\.in/i.test(inner)) { url = decodeURIComponent(inner); continue; }
    } catch { /* not a URL */ }
    break;
  }
  return url.replace(/[?#].*$/, '');
}

const hashtag = (s?: string) => (s || '').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

/**
 * Gets the screenshot ready for the automatic check. Phone screenshots shared through WhatsApp
 * are often only ~600 px wide, which makes the offer letter text too small to read, so small
 * images are enlarged to about 1800 px wide (and very large ones shrunk).
 */
async function compress(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Could not read this image'));
    i.src = dataUrl;
  });
  const w0 = img.naturalWidth, h0 = img.naturalHeight;
  let scale = w0 < 1600 ? 1800 / w0 : Math.min(1, 2000 / w0);
  scale = Math.min(scale, 3, 6000 / h0, Math.sqrt(9_000_000 / (w0 * h0))); // keep within sane limits
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * scale);
  c.height = Math.round(h0 * scale);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.9);
}

/** A real example of a good screenshot (public/linkedin-example.jpg), with the three checks marked. */
function ExampleScreenshot({ role }: { role: string }) {
  const dot = (n: number) => (
    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{n}</span>
  );
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px] items-start">
        <img src="/linkedin-example.jpg" alt="Example (made-up student): a LinkedIn post with the profile name at the top and the Hiresnix offer letter showing the name and role"
          className="w-full max-w-[320px] mx-auto rounded-xl border border-gray-300 shadow-sm" loading="lazy" />
        <ol className="text-[12px] text-gray-700 space-y-2">
          <li className="flex gap-2">{dot(1)}<span><b>Your profile name</b> at the top of the post</span></li>
          <li className="flex gap-2">{dot(2)}<span><b>Your name</b> on the offer letter</span></li>
          <li className="flex gap-2">{dot(3)}<span><b>Your role</b> ({role})</span></li>
          <li className="text-[11px] text-gray-500 pt-1">Take it on your phone from the top of the post, without cropping. Don't zoom out so far that the letter text is unreadable.</li>
        </ol>
      </div>
    </div>
  );
}

export function LinkedInSharePrompt({ open, onClose, onDone, domain, rejectedNote }: Props) {
  const [copied, setCopied] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [shot, setShot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  const postText = useMemo(() => [
    `I'm happy to share that I've been selected for the ${domain ? `${domain} ` : ''}Internship at Hiresnix! 🎉`,
    '',
    "Over the coming weeks I'll be working on real projects, learning from mentors and keeping a daily log of my progress.",
    '',
    'Thank you @Hiresnix for this opportunity. Excited to get started!',
    '',
    ['#Hiresnix', '#Internship', domain ? `#${hashtag(domain)}` : '', '#Learning', '#CareerGrowth'].filter(Boolean).join(' '),
  ].join('\n'), [domain]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyText = async () => {
    try { await navigator.clipboard.writeText(postText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy. Select the text and copy it yourself.'); }
  };

  const chooseShot = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Choose a screenshot image (PNG or JPG)'); return; }
    try { setShot(await compress(file)); } catch (e: any) { toast.error(e?.message || 'Could not read this image'); }
  };

  const submit = async () => {
    if (!postUrl.trim()) { toast.error('Paste the link of your LinkedIn post'); return; }
    if (!shot) { toast.error('Add a screenshot of your LinkedIn post'); return; }
    setSaving(true);
    setProblem(null);
    try {
      const res = await client.post('/cert-unlock/linkedin', { postUrl: cleanLinkedinLink(postUrl), screenshot: shot });
      toast.success(res.data?.message || 'Done!');
      announce();
      onDone?.();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not submit. Try again.';
      setProblem(msg);
      toast.error(msg);
      if (e?.response?.status === 422) { announce(); onDone?.(); } // saved for our team to check; refresh the page state
    } finally {
      setSaving(false);
    }
  };

  const step = 'rounded-2xl border border-gray-200 bg-white p-4';
  const num = 'w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0';
  const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50';

  // Rendered into <body> so no parent card (with transforms or overflow) can trap or cover it
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="li-share-title"
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-gray-50 rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a66c2] text-white flex items-center justify-center shrink-0"><Linkedin size={20} /></div>
            <div>
              <h2 id="li-share-title" className="text-lg font-bold text-gray-900">Share your offer letter on LinkedIn</h2>
              <p className="text-sm text-gray-600 mt-0.5">This step is needed to unlock your internship certificates.</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-gray-500 hover:bg-gray-200"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          {rejectedNote && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <b>Your earlier submission needs a fix:</b> {rejectedNote}
            </div>
          )}

          {/* Step 1: post */}
          <div className={step}>
            <div className="flex items-center gap-3 mb-3"><span className={num}>1</span><h3 className="font-semibold text-gray-900">Post your offer letter</h3></div>
            <textarea readOnly value={postText} rows={9}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 resize-none focus:outline-none" />
            <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc pl-4">
              <li>Attach your offer letter (the PDF you downloaded, or a screenshot of it).</li>
              <li>In the post, type <b>@Hiresnix</b> and pick the Hiresnix company page so it's tagged.</li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" onClick={copyText} className={`${btn} border border-gray-200 bg-white text-gray-800 hover:bg-gray-50`}>
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy text'}
              </button>
              <a href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`} target="_blank" rel="noopener noreferrer"
                className={`${btn} bg-[#0a66c2] text-white hover:bg-[#004182]`}>
                <Linkedin size={15} /> Open LinkedIn to post
              </a>
              <a href={HIRESNIX_LINKEDIN} target="_blank" rel="noopener noreferrer"
                className={`${btn} border border-gray-200 bg-white text-gray-800 hover:bg-gray-50`}>
                Follow Hiresnix
              </a>
            </div>
          </div>

          {/* Step 2: proof */}
          <div className={step}>
            <div className="flex items-center gap-3 mb-3"><span className={num}>2</span><h3 className="font-semibold text-gray-900">Show us it's done</h3></div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="li-post-url">Link to your post</label>
            <input id="li-post-url" value={postUrl} onChange={e => setPostUrl(e.target.value)} inputMode="url"
              onBlur={() => postUrl && setPostUrl(cleanLinkedinLink(postUrl))}
              onPaste={e => { const t = e.clipboardData.getData('text'); if (t) { e.preventDefault(); setPostUrl(cleanLinkedinLink(t)); } }}
              placeholder="https://lnkd.in/… or https://www.linkedin.com/posts/…"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500" />
            <p className="text-[11px] text-gray-500 mt-1">On your post, tap ⋯ (or Share) → Copy link to post.</p>

            <label className="block text-xs font-semibold text-gray-600 mb-1 mt-3">Screenshot of your post</label>
            <p className="text-[11px] text-gray-500 mb-1.5">
              Open your post and take one screenshot <b>from the very top</b>: your <b>LinkedIn profile name</b> above the post, and the
              offer letter showing <b>your name</b> and <b>{domain ? `${domain} Intern` : 'your role'}</b>. We check both names automatically.
            </p>
            <button type="button" onClick={() => setShowExample(v => !v)} className="text-xs font-semibold text-emerald-700 hover:underline mb-2">
              {showExample ? 'Hide example' : 'See an example screenshot'}
            </button>
            {showExample && <div className="mb-3"><ExampleScreenshot role={domain ? `${domain} Intern` : 'Your Role Intern'} /></div>}
            <label className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-3 cursor-pointer hover:border-emerald-500">
              {shot
                ? <img src={shot} alt="Your screenshot" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                : <span className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon size={20} /></span>}
              <span className="text-sm text-gray-700">{shot ? 'Change screenshot' : 'Choose screenshot'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => { chooseShot(e.target.files?.[0]); e.target.value = ''; }} />
            </label>

            {problem && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> <span>{problem}</span>
              </div>
            )}
            <button type="button" onClick={submit} disabled={saving}
              className={`${btn} w-full mt-4 bg-emerald-600 text-white hover:bg-emerald-500 py-3`}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {saving ? 'Checking your screenshot…' : 'Submit and unlock'}
            </button>
          </div>

          {/* Daily log note */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
            <NotebookPen size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-900">
              <b>Keep your daily log going.</b> It's your proof of work for your college, and it's what we look at when we pick interns for real Hiresnix projects.
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center pb-1">
            No LinkedIn account? Write to <a className="font-semibold text-emerald-700" href="mailto:hr@hiresnix.co.in">hr@hiresnix.co.in</a>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default LinkedInSharePrompt;