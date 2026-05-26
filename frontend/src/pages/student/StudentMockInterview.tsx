// src/pages/student/StudentMockInterview.tsx
import React, { useState, useRef, useEffect } from 'react';
import { BotMessageSquare, Send, RotateCcw, Loader2, User } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const DOMAINS = ['Full Stack', 'Frontend', 'Backend', 'Data Science', 'DevOps', 'UI/UX'];

export function StudentMockInterview() {
  const [domain, setDomain] = useState('Full Stack');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    setStarted(true);
    setLoading(true);
    const systemMsg = `You are a senior ${domain} developer conducting a technical mock interview. 
    Ask one question at a time. Start with an intro question, then progressively increase difficulty. 
    After each answer, give brief feedback, then ask the next question. 
    Be professional, encouraging, and educational.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemMsg,
          messages: [{ role: 'user', content: `Start a ${domain} mock interview. Introduce yourself and ask your first question.` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((c: any) => c.text || '').join('') || 'Let\'s begin the interview!';
      setMessages([{ role: 'assistant', content: text }]);
    } catch {
      setMessages([{ role: 'assistant', content: `Hello! I'm your ${domain} interviewer. Let's begin.\n\n**Question 1:** Can you tell me about yourself and your experience with ${domain} development?` }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a senior ${domain} developer conducting a technical mock interview. Give feedback on answers and ask follow-up or next questions. Be encouraging but honest.`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content?.map((c: any) => c.text || '').join('') || 'Good answer! Let\'s continue.';
      setMessages(p => [...p, { role: 'assistant', content: text }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Thank you for your answer. Let\'s move to the next question.' }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setStarted(false);
    setInput('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-black text-gray-900">AI Mock Interview</h1>
        <p className="text-sm text-gray-500 mt-1">Practice technical interviews with AI feedback</p>
      </div>

      {!started ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <BotMessageSquare size={32} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ready to practice?</h2>
            <p className="text-sm text-gray-500 mt-1">Choose your domain and start a mock interview session</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Domain</label>
            <div className="flex flex-wrap gap-2 justify-center">
              {DOMAINS.map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                    domain === d ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={startInterview}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl transition text-sm"
          >
            Start Interview
          </button>
        </div>
      ) : (
        <div className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ height: '65vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <BotMessageSquare size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{domain} Interviewer</p>
                <p className="text-xs text-green-500 font-medium">AI Active</p>
              </div>
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition">
              <RotateCcw size={12} /> New Session
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  {m.role === 'user'
                    ? <User size={14} className="text-white" />
                    : <BotMessageSquare size={14} className="text-gray-600" />
                  }
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <BotMessageSquare size={14} className="text-gray-600" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your answer..."
                disabled={loading}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
