// src/components/HiresnixChatbot.tsx
// Claude-powered floating chatbot for Hiresnix landing page

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Hiresnix AI Assistant — a friendly, helpful chatbot for the Hiresnix platform (hiresnix.co.in). 

About Hiresnix:
- Hiresnix connects students with real internship training programs and startup job opportunities
- Students get Certificates, LORs (Letter of Recommendation), and career support
- Platform offers domains: Web Development, AI/ML, Data Science, App Development, UI/UX Design, Cloud & DevOps, and more
- Internship duration: 6-10 weeks depending on domain
- Students submit weekly tasks and track progress
- After completion: Certificate + Completion Letter + LOR as PDF downloads
- Registration is FREE for students
- Hiresnix is operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED
- Contact: hr@hiresnix.co.in
- Students can also apply for jobs posted by companies on the platform
- Institution students get a unique Career ID (HX-YYYY-XXXXXX)
- Partner institution students may be eligible for internship enrollment benefits

Guidelines:
- Be friendly, concise, and helpful
- Answer in the same language the user writes in (Hindi/Hinglish/English)
- If asked something you don't know about Hiresnix, say "Please contact hr@hiresnix.co.in for more details"
- Keep responses short (2-4 lines max)
- Use emojis occasionally to be friendly
- Don't make up information`;

export function HiresnixChatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! 👋 I'm Hiresnix AI Assistant. How can I help you today? Ask me about internships, certificates, domains, or anything about Hiresnix!" }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Please try again!";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Something went wrong. Please contact hr@hiresnix.co.in 😊" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 9999,
          width: 340, maxHeight: 500,
          background: '#0f172a',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn 0.2s ease',
        }}>
          <style>{`
            @keyframes chatSlideIn {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>Hiresnix AI</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Online · Usually replies instantly
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, borderRadius: 8, display: 'flex' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="white" />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: 13,
                  lineHeight: 1.5,
                  border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 16px 4px', padding: '9px 13px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: `bounce 1s ${i*0.2}s infinite` }} />
                  ))}
                  <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6)} 40%{transform:scale(1)} }`}</style>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['How to apply?', 'What domains?', 'Is it free?', 'Get certificate?'].map(q => (
                <button key={q} onClick={async () => {
                  const userMsg: Message = { role: 'user', content: q };
                  const newMessages = [...messages, userMsg];
                  setMessages(newMessages);
                  setLoading(true);
                  try {
                    const response = await fetch('https://api.anthropic.com/v1/messages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 300, system: SYSTEM_PROMPT, messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
                    });
                    const data = await response.json();
                    setMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || "Please contact hr@hiresnix.co.in 😊" }]);
                  } catch { setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Please contact hr@hiresnix.co.in 😊" }]); }
                  finally { setLoading(false); }
                }}
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '5px 12px', color: '#a5b4fc', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask anything about Hiresnix..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none' }} />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ width: 38, height: 38, borderRadius: 12, background: input.trim() ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
              {loading ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="white" />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
        {open ? <X size={22} color="white" /> : <MessageCircle size={22} color="white" />}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {unread}
          </div>
        )}
      </button>
    </>
  );
}
