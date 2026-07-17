import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Award, CheckCircle2, FileCheck2, FileText, QrCode, Search, XCircle } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { LegalLayout } from '../../components/legal/LegalLayout';
import { COMPANY } from '../../lib/companyInfo';
import { VerificationRecord, VerificationType, verificationApi } from '../../api/verification';

const configs: Record<VerificationType, { label: string; idLabel: string; path: string; icon: typeof Award; placeholder: string }> = {
  certificate: {
    label: 'Internship Certificate',
    idLabel: 'Certificate Number',
    path: '/verification/certificate',
    icon: Award,
    placeholder: 'e.g. HRX-LZ9X4Q',
  },
  'offer-letter': {
    label: 'Offer Letter',
    idLabel: 'Offer Letter ID',
    path: '/verification/offer-letter',
    icon: FileText,
    placeholder: 'e.g. HSH-INT-2026-AB12',
  },
  'recommendation-letter': {
    label: 'Letter of Recommendation',
    idLabel: 'Recommendation Letter ID',
    path: '/verification/recommendation-letter',
    icon: FileCheck2,
    placeholder: 'e.g. LOR-1024',
  },
  'skill-assessment': {
    label: '(Institution) Certificate of Skill Assessment',
    idLabel: 'Certificate ID',
    path: '/verification/skill-assessment',
    icon: Award,
    placeholder: 'e.g. HX-CERT-EFB35F2C',
  },
  'course-completion': {
    label: '(Institution) Certificate of Course Completion',
    idLabel: 'Certificate ID',
    path: '/verification/course-completion',
    icon: FileCheck2,
    placeholder: 'e.g. HX-CERT-504AAFC2',
  },
  'training-completion': {
    label: '(Institution)Certificate of Training Completion',
    idLabel: 'Certificate ID',
    path: '/verification/training-completion',
    icon: FileCheck2,
    placeholder: 'e.g. HX-CERT-504AAFC2',
  },

};

const normalizeType = (type?: string): VerificationType => {
  if (type === 'training-completion') return 'training-completion';
  if (type === 'skill-assessment') return 'skill-assessment';
  if (type === 'course-completion') return 'course-completion';
  if (type === 'offer-letter') return 'offer-letter';
  if (type === 'recommendation-letter') return 'recommendation-letter';
  return 'certificate';
};

const formatDate = (date?: string) => {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export function VerificationPortal({ defaultType }: { defaultType?: VerificationType }) {
  const params = useParams();
  const navigate = useNavigate();
  const type = normalizeType(defaultType || params.type);
  const active = configs[type];
  const [query, setQuery] = useState(params.id || '');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [searchedId, setSearchedId] = useState(params.id || '');
  const [error, setError] = useState('');

  const description = `${active.label} portal for validating Hiresnix internship documents using official document IDs.`;

  useEffect(() => {
    setQuery(params.id || '');
    setRecord(null);
    setError('');
    setSearchedId(params.id || '');
  }, [params.id, type]);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      setRecord(null);
      try {
        const result = await verificationApi.verify(type, params.id || '');
        if (!cancelled) setRecord(result);
      } catch {
        if (!cancelled) setError('No valid document record was found for this ID.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [params.id, type]);

  const Icon = active.icon;
  const title = defaultType ? active.label : 'Verification';
  const schema = useMemo(() => ({
    '@type': 'WebPage',
    name: active.label,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${COMPANY.website}${active.path}/{document_id}`,
      'query-input': 'required name=document_id',
    },
  }), [active.label, active.path, description]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Strip common prefixes users might type
    const value = query.trim()
      .replace(/^LOR\s*ID\s*:\s*/i, '')
      .replace(/^CERT\s*(NO|ID|#)?\s*:\s*/i, '')
      .replace(/^OFFER\s*(LETTER)?\s*(ID|NO)?\s*:\s*/i, '')
      .trim().toUpperCase();
    if (!value) return;
    setSearchedId(value);
    navigate(`${active.path}/${encodeURIComponent(value)}`);
  };

  return (
    <LegalLayout>
      <SEO title={`${title} | Hiresnix`} description={description} path={defaultType ? active.path : '/verification'} structuredData={schema} />
      <section className="px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-lg border border-white/10 bg-[#0b1120] p-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Verification Portal</p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Verify Hiresnix Documents</h1>
              <p className="mt-4 text-sm leading-7 text-slate-400">Search by official IDs printed on Hiresnix documents. Results show validity, student name, issue date, and internship domain.</p>
              <div className="mt-6 space-y-2">
                {(Object.entries(configs) as [VerificationType, typeof active][]).map(([key, item]) => (
                  <Link
                    key={key}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition ${type === key ? 'border-blue-400/50 bg-blue-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-5">
                <QrCode className="text-blue-400" size={22} />
                <h2 className="mt-3 text-sm font-bold text-white">QR Verification Ready</h2>
                <p className="mt-2 text-xs leading-6 text-slate-500">Document QR codes can point directly to these verification routes using the official document ID.</p>
              </div>
            </aside>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Type</p>
                  <h2 className="mt-1 flex items-center gap-3 text-2xl font-black text-white"><Icon className="text-blue-400" size={26} />{active.label}</h2>
                </div>
                <span className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">Secure Lookup</span>
              </div>

              <form onSubmit={submit} className="mt-7 rounded-lg border border-white/10 bg-[#0b1120] p-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{active.idLabel}</label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-400" placeholder={active.placeholder} />
                  </div>
                  <button className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-500 px-6 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50" disabled={!query.trim() || loading}>
                    {loading ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </form>

              <div className="mt-6 rounded-lg border border-white/10 bg-[#0b1120] p-5">
                {!searchedId && !loading && (
                  <div className="py-12 text-center">
                    <Search className="mx-auto text-slate-600" size={42} />
                    <p className="mt-4 text-sm font-semibold text-slate-400">Enter a document ID to begin verification.</p>
                  </div>
                )}
                {loading && <div className="py-12 text-center text-sm font-semibold text-slate-400">Verifying official record...</div>}
                {error && !loading && (
                  <div className="py-8 text-center">
                    <XCircle className="mx-auto text-red-400" size={54} />
                    <h3 className="mt-4 text-xl font-black text-white">Invalid</h3>
                    <p className="mt-2 text-sm text-slate-400">{error}</p>
                    <p className="mt-2 font-mono text-xs text-slate-500">{searchedId}</p>
                  </div>
                )}
                {record && !loading && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                      <div className="flex items-center gap-3">
                        {record.valid ? <CheckCircle2 className="text-emerald-400" size={42} /> : <XCircle className="text-red-400" size={42} />}
                        <div>
                          <p className={`text-sm font-bold uppercase tracking-wider ${record.valid ? 'text-emerald-300' : 'text-red-300'}`}>{record.valid ? 'Valid' : 'Invalid'}</p>
                          <h3 className="text-xl font-black text-white">Official Record {record.valid ? 'Found' : 'Revoked'}</h3>
                        </div>
                      </div>
                      <span className="rounded-lg border border-white/10 px-3 py-2 font-mono text-xs text-slate-400">{record.documentId || searchedId}</span>
                    </div>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      {[
                        ['Student Name', record.studentName || 'Not available'],
                        ['Issue Date', formatDate(record.issueDate) || 'Not available'],
                        [
                          (type === 'skill-assessment' || type === 'course-completion') ? 'Course / Subject' : 'Internship Domain',
                          record.internshipDomain || 'Not available'
                        ],
                        ['Document Type', record.documentType || active.label],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                          <dd className="mt-2 text-sm font-bold text-slate-100">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}