// src/pages/admin/AdminSignForm.tsx
// Admin tool: upload a college's form (PDF or photo), place the company
// signature / stamp / date on it, and download the signed PDF.
// Everything happens in the browser. The form is never uploaded to the server;
// only the signature and stamp images are fetched (main admin only).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Upload, Download, Loader2, ChevronLeft, ChevronRight, Trash2, Type,
  PenLine, Stamp, ImagePlus, FileText, RotateCcw, Lock, Check, Copy, X,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, StandardFonts, rgb, degrees, LineCapStyle } from 'pdf-lib';
import client from '../../api/client';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ─── Types ──────────────────────────────────────────────────────────
type AssetInfo = { key: string; label: string; kind: 'signature' | 'stamp'; available: boolean };
type LoadedAsset = { key: string; label: string; kind: string; dataUrl: string; aspect: number };

type PageInfo = {
  width: number;     // displayed width at scale 1 (points, rotation applied)
  height: number;
  rotation: number;  // page /Rotate (0, 90, 180, 270)
  viewport: any;     // pdf.js viewport at scale 1, used to convert to PDF coordinates
};

type Placement = {
  id: string;
  page: number;      // 0-based
  type: 'image' | 'text' | 'tick';
  assetKey?: string;
  text?: string;
  color?: 'black' | 'blue';
  x: number;         // left, fraction of page width
  y: number;         // top, fraction of page height
  w: number;         // width, fraction of page width (images and ticks)
  fontSize?: number; // fraction of page height (text)
};

const INK = { black: rgb(0.05, 0.05, 0.08), blue: rgb(0.08, 0.16, 0.5) };
const INK_CSS = { black: '#0d0d14', blue: '#142980' };

// Tick mark drawn as a vector path in a 24×24 box (same path on screen and in the PDF)
const TICK_PATH = 'M3.5 13 L9 18.5 L20.5 5.5';
const TICK_STROKE = 3.2;
const TEXT_LINE = 1.2;      // line height for text items
const TEXT_BASELINE = 0.93; // first baseline below the top of a text box, × font size

const MAX_DOC_BYTES = 25 * 1024 * 1024;

const panelCls = 'rounded-xl border border-white/10 bg-[#111827] p-4';
const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5';
const btnCls = 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed';

const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ─── Image helpers ──────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Could not read the image'));
    img.src = src;
  });
}

/**
 * Makes near-white pixels transparent (for scanned/photographed signatures and
 * stamps), trims empty margins and scales down to keep the final PDF small.
 */
async function prepareInk(src: string, removeWhite: boolean, maxSide = 900): Promise<{ dataUrl: string; aspect: number }> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < px.length; i += 4) {
    if (removeWhite) {
      // Brightness-based fade: paper (bright) becomes transparent, ink stays
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
      if (lum > 215 && sat < 40) px[i + 3] = 0;
      else if (lum > 170 && sat < 40) px[i + 3] = Math.round(px[i + 3] * (215 - lum) / 45);
    }
    if (px[i + 3] > 30) {
      const p = i / 4, x = p % w, y = (p - x) / w;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('The image looks empty after removing the background');
  ctx.putImageData(data, 0, 0);

  const pad = 4;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;

  const out = document.createElement('canvas');
  out.width = cw; out.height = ch;
  out.getContext('2d')!.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return { dataUrl: out.toDataURL('image/png'), aspect: cw / ch };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

/** Turns a photo/scan (JPG, PNG, WEBP) into a one-page A4-width PDF. */
async function imageFileToPdf(file: File): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let embedded;
  if (file.type === 'image/jpeg') {
    embedded = await pdf.embedJpg(await file.arrayBuffer());
  } else {
    // PNG, WEBP etc. → re-encode as JPEG through a canvas (smaller, always embeddable)
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      const jpg = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Could not convert image'))), 'image/jpeg', 0.9));
      embedded = await pdf.embedJpg(await jpg.arrayBuffer());
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const pageW = 595.28; // A4 width in points
  const pageH = pageW * (embedded.height / embedded.width);
  const page = pdf.addPage([pageW, pageH]);
  page.drawImage(embedded, { x: 0, y: 0, width: pageW, height: pageH });
  return pdf.save();
}

/**
 * docx-preview places "in front of text" pictures (like a letterhead footer) relative to
 * their paragraph, even when Word positions them relative to the page. That pushes them
 * off the page. Re-read those positions from the file and pin the pictures to the page.
 */
async function pinPageAnchoredPictures(wordDoc: any, idoc: Document) {
  try {
    const xml: string | undefined = await wordDoc?._package?.load('word/document.xml', 'string');
    if (!xml) return;
    const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
    const x = new DOMParser().parseFromString(xml, 'application/xml');
    const read = (a: Element, tag: string) => {
      const el = a.getElementsByTagNameNS(WP, tag)[0];
      return { rel: el?.getAttribute('relativeFrom') || '', off: el?.getElementsByTagNameNS(WP, 'posOffset')[0]?.textContent ?? null };
    };
    // docx-preview turns only "wrapNone" anchors into 0×0 relative boxes, so match those in order
    const anchors = Array.from(x.getElementsByTagNameNS(WP, 'anchor'))
      .filter(a => a.getElementsByTagNameNS(WP, 'wrapNone').length > 0 && a.getAttribute('simplePos') !== '1')
      .map(a => ({ h: read(a, 'positionH'), v: read(a, 'positionV') }));
    const boxes = (Array.from(idoc.querySelectorAll('section.docx article *')) as HTMLElement[])
      .filter(el => el.style.position === 'relative' && el.style.width === '0px' && el.style.height === '0px');
    if (!anchors.length || boxes.length !== anchors.length) return;

    const emuToPx = (emu: string) => (Number(emu) / 12700) * (96 / 72);
    boxes.forEach((box, i) => {
      const sec = box.closest('section.docx') as HTMLElement | null;
      if (!sec) return;
      const { h, v } = anchors[i];
      const cs = getComputedStyle(sec);
      const secRect = sec.getBoundingClientRect();
      const r = box.getBoundingClientRect();
      const pos = (p: { rel: string; off: string | null }, margin: number, current: number) =>
        p.off !== null && (p.rel === 'page' || p.rel === 'margin') ? emuToPx(p.off) + (p.rel === 'margin' ? margin : 0) : current;
      const left = pos(h, parseFloat(cs.paddingLeft) || 0, r.left - secRect.left);
      const top = pos(v, parseFloat(cs.paddingTop) || 0, r.top - secRect.top);
      sec.appendChild(box);
      box.style.position = 'absolute';
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.zIndex = '2';
    });
  } catch {
    /* leave the layout as docx-preview made it */
  }
}

/**
 * Turns a Word (.docx) file into a PDF inside the browser.
 * The document is laid out by docx-preview in a hidden iframe (so the app's own
 * CSS can't disturb it), each page is captured with html2canvas and placed on a
 * PDF page of the document's real page size. Word's own saved page breaks are used.
 */
async function docxFileToPdf(file: File): Promise<{ bytes: Uint8Array; warnTall: boolean }> {
  const [{ renderAsync }, { default: html2canvas }] = await Promise.all([
    import('docx-preview'),
    import('html2canvas'),
  ]);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;left:-20000px;top:0;width:1400px;height:2000px;border:0;';
  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentDocument!;
    idoc.open();
    idoc.write('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;color:#000;}</style></head><body></body></html>');
    idoc.close();

    const wordDoc = await renderAsync(await file.arrayBuffer(), idoc.body, idoc.head, {
      inWrapper: false,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: false, // follow where Word itself broke the pages
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      renderComments: false,
      renderChanges: false,
      useBase64URL: true,
      experimental: true,
    });

    // Wait for fonts and images inside the iframe before capturing
    try { await (idoc as any).fonts?.ready; } catch { /* ignore */ }
    await Promise.all(Array.from(idoc.images).map(img =>
      img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = () => res(null); })));

    await pinPageAnchoredPictures(wordDoc, idoc);

    const sections = Array.from(idoc.querySelectorAll('section.docx')) as HTMLElement[];
    if (!sections.length) throw new Error('empty');

    const pdf = await PDFDocument.create();
    const ptOf = (v: string, fallback: number) => {
      const m = /([\d.]+)pt/.exec(v || '');
      return m ? parseFloat(m[1]) : fallback;
    };
    let warnTall = false;

    for (const sec of sections) {
      const wPt = ptOf(sec.style.width, 595.28);
      const hPt = ptOf(sec.style.minHeight, 841.89);
      const rect = sec.getBoundingClientRect();
      const pagePx = rect.width * (hPt / wPt);
      // foreignObject mode lets the browser draw the page itself (matches the layout exactly).
      // Some browsers (Safari) block reading that canvas back; then fall back to html2canvas' own drawing.
      const capture = (foreignObjectRendering: boolean) =>
        html2canvas(sec, { scale: 2.5, backgroundColor: '#ffffff', logging: false, useCORS: true, foreignObjectRendering });
      let canvas = await capture(true);
      try { canvas.getContext('2d')!.getImageData(0, 0, 1, 1); } catch { canvas = await capture(false); }
      const pxPerCss = canvas.width / rect.width;
      const sliceH = Math.round(pagePx * pxPerCss);
      const slices = Math.max(1, Math.ceil((canvas.height - 2) / sliceH));
      if (slices > 1) warnTall = true;

      for (let i = 0; i < slices; i++) {
        const c = document.createElement('canvas');
        c.width = canvas.width; c.height = sliceH;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(canvas, 0, -i * sliceH);
        const jpg = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('capture failed'))), 'image/jpeg', 0.92));
        const img = await pdf.embedJpg(await jpg.arrayBuffer());
        const page = pdf.addPage([wPt, hPt]);
        page.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
      }
    }
    return { bytes: await pdf.save(), warnTall };
  } finally {
    iframe.remove();
  }
}

// ─── Component ──────────────────────────────────────────────────────
export function AdminSignForm() {
  const [assetList, setAssetList] = useState<AssetInfo[]>([]);
  const [assets, setAssets] = useState<Record<string, LoadedAsset>>({});
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(true);

  const [docBytes, setDocBytes] = useState<Uint8Array | null>(null);
  const [docName, setDocName] = useState('');
  const [pdf, setPdf] = useState<any>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [opening, setOpening] = useState(false);

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [tickMode, setTickMode] = useState(false);
  const [tickColor, setTickColor] = useState<'black' | 'blue'>('blue');
  const [wordFile, setWordFile] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(700);
  const dragRef = useRef<null | { id: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: Placement }>(null);

  const selected = placements.find(p => p.id === selectedId) || null;
  const pageInfo = pages[pageIdx];
  const stageH = pageInfo ? stageW * (pageInfo.height / pageInfo.width) : 0;

  // ── Load the signature / stamp images ──
  useEffect(() => {
    (async () => {
      try {
        const res = await client.get('/sign-assets');
        const list: AssetInfo[] = res.data?.data || [];
        setAssetList(list);
        const loaded: Record<string, LoadedAsset> = {};
        await Promise.all(list.filter(a => a.available).map(async a => {
          try {
            const img = await client.get(`/sign-assets/${a.key}`, { responseType: 'blob' });
            const src = await blobToDataUrl(img.data);
            const prepared = await prepareInk(src, true);
            loaded[a.key] = { key: a.key, label: a.label, kind: a.kind, ...prepared };
          } catch {
            /* one asset failing should not block the others */
          }
        }));
        setAssets(loaded);
      } catch (e: any) {
        setAssetError(e?.response?.status === 403
          ? 'Only the main admin account can use the company signature and stamp.'
          : 'Could not load the signature images. Check that the backend is running and try again.');
      } finally {
        setAssetsLoading(false);
      }
    })();
  }, []);

  // ── Keep the preview width in sync with the available space ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(Math.min(el.clientWidth, 900)));
    ro.observe(el);
    setStageW(Math.min(el.clientWidth, 900));
    return () => ro.disconnect();
  }, [pdf]);

  // ── Render the current page ──
  useEffect(() => {
    if (!pdf || !pageInfo || !canvasRef.current) return;
    let task: any;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageIdx + 1);
      if (cancelled) return;
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: (stageW / pageInfo.width) * dpr });
      const canvas = canvasRef.current!;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: canvas.getContext('2d')!, viewport });
      try { await task.promise; } catch { /* cancelled by a newer render */ }
    })();
    return () => { cancelled = true; task?.cancel?.(); };
  }, [pdf, pageIdx, stageW, pageInfo]);

  // ── Open a form ──
  const openFile = async (file: File) => {
    if (file.size > MAX_DOC_BYTES) { toast.error('File is larger than 25 MB. Compress it and try again.'); return; }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');
    const isDocx = /\.docx$/i.test(file.name);
    if (/\.(doc|odt)$/i.test(file.name)) { setWordFile(file.name); return; }
    if (!isPdf && !isImg && !isDocx) { toast.error('Upload a Word (.docx), PDF, JPG or PNG file.'); return; }
    setWordFile(null);

    setOpening(true);
    try {
      let bytes: Uint8Array;
      if (isPdf) bytes = new Uint8Array(await file.arrayBuffer());
      else if (isDocx) {
        const res = await docxFileToPdf(file);
        bytes = res.bytes;
        if (res.warnTall) toast.message('Some pages ran longer than one sheet and were split. Check the page breaks before signing.');
      } else bytes = await imageFileToPdf(file);
      // pdf.js takes ownership of the buffer it receives, so give it a copy
      const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
      const infos: PageInfo[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i);
        const vp = p.getViewport({ scale: 1 });
        infos.push({ width: vp.width, height: vp.height, rotation: vp.rotation, viewport: vp });
      }
      setPdf(doc);
      setPages(infos);
      setDocBytes(bytes);
      setDocName(file.name.replace(/\.[^.]+$/, ''));
      setPageIdx(0);
      setPlacements([]);
      setSelectedId(null);
    } catch (e: any) {
      toast.error(e?.name === 'PasswordException'
        ? 'This PDF is password-protected. Ask the college for an unlocked copy.'
        : isDocx
          ? 'Could not open this Word file. Save it as PDF in Word (File → Save As → PDF) and upload the PDF.'
          : 'Could not open this file. Try another PDF or a clear photo of the form.');
    } finally {
      setOpening(false);
    }
  };

  // ── Add items ──
  const addImage = (key: string) => {
    const a = assets[key];
    if (!a || !pageInfo) return;
    const w = a.kind === 'stamp' ? 0.18 : 0.24;
    const hFrac = (w * pageInfo.width / a.aspect) / pageInfo.height;
    const p: Placement = { id: uid(), page: pageIdx, type: 'image', assetKey: key, x: 0.5 - w / 2, y: clamp(0.5 - hFrac / 2, 0, 1), w };
    setPlacements(ps => [...ps, p]);
    setSelectedId(p.id);
  };

  const addText = () => {
    if (!pageInfo) return;
    const p: Placement = { id: uid(), page: pageIdx, type: 'text', text: todayStr(), color: 'black', x: 0.4, y: 0.5, w: 0, fontSize: 0.016 };
    setPlacements(ps => [...ps, p]);
    setSelectedId(p.id);
  };

  const addTickAt = (x: number, y: number) => {
    if (!pageInfo) return;
    const w = 0.022;
    const hFrac = (w * pageInfo.width) / pageInfo.height;
    const p: Placement = { id: uid(), page: pageIdx, type: 'tick', color: tickColor, x: x - w / 2, y: y - hFrac / 2, w };
    setPlacements(ps => [...ps, p]);
    setSelectedId(null);
  };

  const duplicate = (src: Placement) => {
    if (!pageInfo) return;
    // Put the copy just below the original, handy for a signature on every row
    const h = src.type === 'text'
      ? (src.fontSize || 0.016) * TEXT_LINE * Math.max(1, (src.text || '').split('\n').length)
      : src.type === 'tick'
        ? (src.w * pageInfo.width) / pageInfo.height
        : (src.w * pageInfo.width / (assets[src.assetKey || '']?.aspect || 1)) / pageInfo.height;
    const copy: Placement = { ...src, id: uid(), y: clamp(src.y + h + 0.005, -0.05, 0.98) };
    setPlacements(ps => [...ps, copy]);
    setSelectedId(copy.id);
  };

  const uploadCustomStamp = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Choose a PNG or JPG image of the stamp.'); return; }
    const url = URL.createObjectURL(file);
    try {
      const prepared = await prepareInk(url, removeWhite);
      const key = `custom-${uid()}`;
      setAssets(prev => ({ ...prev, [key]: { key, label: file.name, kind: 'stamp', ...prepared } }));
      toast.success('Stamp image added. Click it to place it on the form.');
    } catch (e: any) {
      toast.error(e?.message || 'Could not read this image');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const update = (id: string, patch: Partial<Placement>) =>
    setPlacements(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => {
    setPlacements(ps => ps.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // ── Drag and resize ──
  const onPointerDown = (e: React.PointerEvent, p: Placement, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(p.id);
    dragRef.current = { id: p.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...p } };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !pageInfo) return;
    const dx = (e.clientX - d.startX) / stageW;
    const dy = (e.clientY - d.startY) / stageH;
    if (d.mode === 'move') {
      update(d.id, { x: clamp(d.orig.x + dx, -0.05, 0.98), y: clamp(d.orig.y + dy, -0.05, 0.98) });
    } else if (d.orig.type === 'image') {
      update(d.id, { w: clamp(d.orig.w + dx, 0.03, 0.9) });
    } else if (d.orig.type === 'tick') {
      update(d.id, { w: clamp(d.orig.w + dx, 0.008, 0.1) });
    } else {
      update(d.id, { fontSize: clamp((d.orig.fontSize || 0.016) + dy * 0.5, 0.006, 0.08) });
    }
  }, [pageInfo, stageW, stageH]);

  const onPointerUp = () => { dragRef.current = null; };

  // Delete key removes the selected item; arrow keys nudge it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setTickMode(false); setSelectedId(null); return; }
      if (!selected) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(selected.id); return; }
      const step = e.shiftKey ? 0.01 : 0.002;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        e.preventDefault();
        update(selected.id, { x: selected.x + moves[e.key][0], y: selected.y + moves[e.key][1] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, tickMode]);

  // ── Build and download the signed PDF ──
  const download = async () => {
    if (!docBytes || !placements.length) return;
    setSaving(true);
    try {
      const out = await PDFDocument.load(docBytes, { ignoreEncryption: true });
      const font = await out.embedFont(StandardFonts.Helvetica);
      const embedded: Record<string, any> = {};

      for (const p of placements) {
        const info = pages[p.page];
        const page = out.getPage(p.page);
        const vp = info.viewport;
        const rot = degrees(info.rotation);
        const left = p.x * info.width;
        const top = p.y * info.height;

        if (p.type === 'image' && p.assetKey && assets[p.assetKey]) {
          const a = assets[p.assetKey];
          if (!embedded[a.key]) embedded[a.key] = await out.embedPng(a.dataUrl);
          const w = p.w * info.width;
          const h = w / a.aspect;
          // bottom-left corner of the item as seen on screen → PDF coordinates
          const [x, y] = vp.convertToPdfPoint(left, top + h);
          page.drawImage(embedded[a.key], { x, y, width: w, height: h, rotate: rot });
        } else if (p.type === 'text' && p.text?.trim()) {
          const size = (p.fontSize || 0.016) * info.height;
          const [x, y] = vp.convertToPdfPoint(left, top + size * TEXT_BASELINE);
          page.drawText(p.text, { x, y, size, font, lineHeight: size * TEXT_LINE, color: INK[p.color || 'black'], rotate: rot });
        } else if (p.type === 'tick') {
          const w = p.w * info.width;
          const [x, y] = vp.convertToPdfPoint(left, top);
          page.drawSvgPath(TICK_PATH, {
            x, y, scale: w / 24, rotate: rot,
            borderColor: INK[p.color || 'blue'], borderWidth: TICK_STROKE,
            borderLineCap: LineCapStyle.Round,
          });
        }
      }

      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docName || 'form'}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success('Signed form downloaded');
    } catch (e: any) {
      toast.error(/[Ee]ncrypt/.test(e?.message || '')
        ? 'This PDF is protected and cannot be changed. Ask the college for an unlocked copy, or upload a photo of the form instead.'
        : 'Could not create the signed PDF. Try again, or upload a photo of the form instead.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPdf(null); setPages([]); setDocBytes(null); setPlacements([]); setSelectedId(null); setDocName('');
  };

  const pagePlacements = placements.filter(p => p.page === pageIdx);
  const loadedList = Object.values(assets);
  const stampMissing = assetList.some(a => a.key === 'stamp' && !a.available);

  // ─── UI ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Sign college form</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Upload the form a college sent for an intern, place the signature, stamp and date where they belong, then download the signed PDF.
          The form stays on this computer and is not uploaded or saved anywhere.
        </p>
      </div>

      {assetError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <Lock size={16} className="mt-0.5 shrink-0" /> {assetError}
        </div>
      )}

      {wordFile && !pdf && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 space-y-1.5">
          <div className="font-medium text-amber-200 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate">“{wordFile}” is in an old Word or OpenDocument format. Save it as .docx or PDF first, then upload it again.</span>
            <button onClick={() => setWordFile(null)} className="text-amber-300 hover:text-white shrink-0" aria-label="Close"><X size={15} /></button>
          </div>
          <div>In Word: File → Save As → choose “Word Document (.docx)” or “PDF” → Save.</div>
          <div>In Google Docs: File → Download → PDF document.</div>
        </div>
      )}

      {!pdf ? (
        <label
          className={`${panelCls} flex flex-col items-center justify-center gap-3 py-16 cursor-pointer border-dashed hover:border-emerald-500/50 transition`}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) openFile(f); }}
        >
          {opening ? <Loader2 size={28} className="animate-spin text-emerald-400" /> : <Upload size={28} className="text-emerald-400" />}
          <div className="text-white font-medium">{opening ? 'Opening the form…' : 'Upload the college form'}</div>
          <div className="text-xs text-slate-400">Word (.docx), PDF, or a JPG/PNG photo or scan. Drop it here or click to choose.</div>
          <input type="file" accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/jpeg,image/png,image/webp" className="hidden" disabled={opening}
            onChange={e => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = ''; }} />
        </label>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* ── Left: tools ── */}
          <aside className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className={panelCls}>
              <div className="flex items-center gap-2 text-sm text-white font-medium mb-1 min-w-0">
                <FileText size={15} className="text-slate-400 shrink-0" />
                <span className="truncate" title={docName}>{docName}</span>
              </div>
              <div className="text-xs text-slate-500">{pages.length} page{pages.length > 1 ? 's' : ''}</div>
              <button onClick={reset} className={`${btnCls} mt-3 w-full border border-white/10 text-slate-300 hover:bg-white/5`}>
                <RotateCcw size={14} /> Use a different form
              </button>
            </div>

            <div className={panelCls}>
              <div className={labelCls}>Add to page {pageIdx + 1}</div>
              {assetsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2"><Loader2 size={14} className="animate-spin" /> Loading signatures…</div>
              ) : (
                <div className="space-y-2">
                  {loadedList.map(a => (
                    <button key={a.key} onClick={() => addImage(a.key)}
                      className="w-full flex items-center gap-3 rounded-lg border border-white/10 bg-white p-2 text-left hover:ring-2 hover:ring-emerald-500/60 transition">
                      <img src={a.dataUrl} alt="" className="h-10 w-16 object-contain shrink-0" />
                      <span className="text-xs text-slate-800 leading-snug">{a.label}</span>
                    </button>
                  ))}
                  <button onClick={addText} className={`${btnCls} w-full border border-white/10 text-slate-200 hover:bg-white/5 justify-start`}>
                    <Type size={14} /> Text (date, name, comments)
                  </button>
                  <button onClick={() => { setTickMode(m => !m); setSelectedId(null); }}
                    className={`${btnCls} w-full border justify-start ${tickMode ? 'border-emerald-500 bg-emerald-500/15 text-white' : 'border-white/10 text-slate-200 hover:bg-white/5'}`}>
                    <Check size={14} /> {tickMode ? 'Ticking: click boxes on the page' : 'Tick ✓ boxes'}
                  </button>
                  {tickMode && (
                    <div className="flex items-center gap-2 pl-1">
                      {(['blue', 'black'] as const).map(c => (
                        <button key={c} onClick={() => setTickColor(c)} aria-label={c}
                          className={`w-5 h-5 rounded-full border-2 ${tickColor === c ? 'border-emerald-400' : 'border-transparent'}`}
                          style={{ background: INK_CSS[c] }} />
                      ))}
                      <span className="text-[11px] text-slate-500">Press Esc when done</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={panelCls}>
              <div className={labelCls}>{stampMissing ? 'Company stamp' : 'Another stamp or signature'}</div>
              {stampMissing && (
                <p className="text-xs text-amber-300/90 mb-2">
                  The permanent stamp is not set up yet. Choose a photo of the stamp to use it now.
                </p>
              )}
              <label className={`${btnCls} w-full border border-white/10 text-slate-200 hover:bg-white/5 cursor-pointer`}>
                <ImagePlus size={14} /> Choose image
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadCustomStamp(f); e.target.value = ''; }} />
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={removeWhite} onChange={e => setRemoveWhite(e.target.checked)} className="accent-emerald-500" />
                Remove white paper background
              </label>
            </div>

            {selected && (
              <div className={panelCls}>
                <div className="flex items-center justify-between mb-2">
                  <div className={labelCls + ' mb-0'}>Selected item</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => duplicate(selected)} className="text-slate-300 hover:text-white p-1" title="Copy below" aria-label="Copy below"><Copy size={15} /></button>
                    <button onClick={() => remove(selected.id)} className="text-red-400 hover:text-red-300 p-1" title="Remove" aria-label="Remove item"><Trash2 size={15} /></button>
                  </div>
                </div>
                {selected.type === 'text' ? (
                  <div className="space-y-3">
                    <textarea value={selected.text || ''} rows={3} onChange={e => update(selected.id, { text: e.target.value })}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-y" />
                    <p className="text-[11px] text-slate-500 -mt-2">Press Enter for a new line.</p>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Size</div>
                      <input type="range" min={0.006} max={0.05} step={0.001} value={selected.fontSize || 0.016}
                        onChange={e => update(selected.id, { fontSize: Number(e.target.value) })} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex gap-2">
                      {(['black', 'blue'] as const).map(c => (
                        <button key={c} onClick={() => update(selected.id, { color: c })}
                          className={`${btnCls} flex-1 border ${selected.color === c ? 'border-emerald-500 text-white' : 'border-white/10 text-slate-400'}`}>
                          <span className="w-3 h-3 rounded-full" style={{ background: INK_CSS[c] }} /> {c === 'black' ? 'Black' : 'Blue'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selected.type === 'tick' ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Size</div>
                      <input type="range" min={0.008} max={0.08} step={0.001} value={selected.w}
                        onChange={e => update(selected.id, { w: Number(e.target.value) })} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex gap-2">
                      {(['blue', 'black'] as const).map(c => (
                        <button key={c} onClick={() => update(selected.id, { color: c })}
                          className={`${btnCls} flex-1 border ${selected.color === c ? 'border-emerald-500 text-white' : 'border-white/10 text-slate-400'}`}>
                          <span className="w-3 h-3 rounded-full" style={{ background: INK_CSS[c] }} /> {c === 'black' ? 'Black' : 'Blue'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Size</div>
                    <input type="range" min={0.03} max={0.6} step={0.005} value={selected.w}
                      onChange={e => update(selected.id, { w: Number(e.target.value) })} className="w-full accent-emerald-500" />
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-3">Drag to move. Arrow keys nudge it, Delete removes it. Copy puts a duplicate just below, useful for a signature on every row.</p>
              </div>
            )}

            <button onClick={download} disabled={!placements.length || saving}
              className={`${btnCls} w-full py-3 bg-emerald-600 text-white hover:bg-emerald-500`}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download signed PDF
            </button>
            {!placements.length && <p className="text-xs text-slate-500 text-center -mt-2">Add a signature or stamp first.</p>}
          </aside>

          {/* ── Right: page preview ── */}
          <section className="min-w-0">
            {pages.length > 1 && (
              <div className="flex items-center justify-center gap-3 mb-3">
                <button onClick={() => { setPageIdx(i => Math.max(0, i - 1)); setSelectedId(null); }} disabled={pageIdx === 0}
                  className={`${btnCls} border border-white/10 text-slate-300 hover:bg-white/5`} aria-label="Previous page"><ChevronLeft size={16} /></button>
                <span className="text-sm text-slate-300">Page {pageIdx + 1} of {pages.length}</span>
                <button onClick={() => { setPageIdx(i => Math.min(pages.length - 1, i + 1)); setSelectedId(null); }} disabled={pageIdx === pages.length - 1}
                  className={`${btnCls} border border-white/10 text-slate-300 hover:bg-white/5`} aria-label="Next page"><ChevronRight size={16} /></button>
              </div>
            )}

            <div ref={wrapRef} className="w-full">
              <div
                ref={stageRef}
                className={`relative mx-auto bg-white shadow-2xl select-none touch-none ${tickMode ? 'cursor-crosshair' : ''}`}
                style={{ width: stageW, height: stageH }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerDown={e => {
                  if (tickMode) {
                    const r = stageRef.current!.getBoundingClientRect();
                    addTickAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
                  } else {
                    setSelectedId(null);
                  }
                }}
              >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {pagePlacements.map(p => {
                  const isSel = p.id === selectedId;
                  const ring = isSel ? 'outline outline-2 outline-emerald-500' : 'hover:outline hover:outline-1 hover:outline-emerald-400/70';
                  if (p.type === 'image' && p.assetKey && assets[p.assetKey]) {
                    const a = assets[p.assetKey];
                    const w = p.w * stageW;
                    return (
                      <div key={p.id} className={`absolute cursor-move ${ring}`}
                        style={{ left: p.x * stageW, top: p.y * stageH, width: w, height: w / a.aspect }}
                        onPointerDown={e => onPointerDown(e, p, 'move')}>
                        <img src={a.dataUrl} alt="" draggable={false} className="w-full h-full pointer-events-none" />
                        {isSel && <Handle onPointerDown={e => onPointerDown(e, p, 'resize')} />}
                      </div>
                    );
                  }
                  if (p.type === 'text') {
                    const size = (p.fontSize || 0.016) * stageH;
                    return (
                      <div key={p.id} className={`absolute cursor-move whitespace-pre ${ring}`}
                        style={{ left: p.x * stageW, top: p.y * stageH, fontSize: size, lineHeight: TEXT_LINE, color: INK_CSS[p.color || 'black'], fontFamily: 'Helvetica, Arial, sans-serif' }}
                        onPointerDown={e => onPointerDown(e, p, 'move')}>
                        {p.text || ' '}
                        {isSel && <Handle onPointerDown={e => onPointerDown(e, p, 'resize')} />}
                      </div>
                    );
                  }
                  if (p.type === 'tick') {
                    const w = p.w * stageW;
                    return (
                      <div key={p.id} className={`absolute cursor-move ${ring}`}
                        style={{ left: p.x * stageW, top: p.y * stageH, width: w, height: w }}
                        onPointerDown={e => { if (tickMode) { e.stopPropagation(); remove(p.id); return; } onPointerDown(e, p, 'move'); }}>
                        <svg viewBox="0 0 24 24" className="w-full h-full pointer-events-none" fill="none">
                          <path d={TICK_PATH} stroke={INK_CSS[p.color || 'blue']} strokeWidth={TICK_STROKE} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {isSel && <Handle onPointerDown={e => onPointerDown(e, p, 'resize')} />}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-3 flex items-center justify-center gap-4">
              <span className="inline-flex items-center gap-1"><PenLine size={12} /> Signature</span>
              <span className="inline-flex items-center gap-1"><Stamp size={12} /> Stamp</span>
              {tickMode ? 'Click each box to tick it. Click a tick again to remove it.' : 'Click an item on the left to add it to this page, then drag it into place.'}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function Handle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      onPointerDown={onPointerDown}
      className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white cursor-nwse-resize"
      aria-label="Resize"
    />
  );
}

export default AdminSignForm;