import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCertificateByHash } from '../lib/academy/academySupabase'
import { supabase } from '../lib/supabaseClient'
import type { Certificate } from '../lib/academy/academyTypes'

interface VerifyData extends Certificate {
  student_name: string
  course_title: string
}

export default function CertificateVerify() {
  const { hash } = useParams<{ hash: string }>()
  const [data, setData]     = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!hash) return

    async function verify() {
      setLoading(true)
      try {
        const cert = await getCertificateByHash(hash!)
        if (!cert) { setNotFound(true); return }

        // Fetch student name from profiles or auth.users metadata
        const { data: profile } = await supabase
          .from('profiles')   // adjust to your existing profiles table name
          .select('full_name')
          .eq('id', cert.user_id)
          .maybeSingle()

        // Fetch course title
        const { data: course } = await supabase
          .from('courses')
          .select('title')
          .eq('id', cert.course_id)
          .single()

        setData({
          ...cert,
          student_name: profile?.full_name ?? 'Student',
          course_title: course?.title ?? 'Course',
        })
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [hash])

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <p className="text-sm text-gray-400">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Certificate not found
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            No certificate found with ID:
          </p>
          <code className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
            {hash}
          </code>
          <p className="text-xs text-gray-400 mt-4">
            If you believe this is an error, contact{' '}
            <a href="mailto:support@hiresnix.co.in" className="text-blue-500 hover:underline">
              support@hiresnix.co.in
            </a>
          </p>
          <Link
            to="/"
            className="inline-block mt-6 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Hiresnix
          </Link>
        </div>
      </div>
    )
  }

  // ── Valid certificate ──────────────────────────────────────
  const issuedDate = new Date(data.issued_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Valid badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              Valid Certificate
            </span>
          </div>
        </div>

        {/* Certificate card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          {/* Dark navy header */}
          <div className="bg-[#0a0f28] px-6 py-5 text-center">
            <p className="text-xs text-amber-400 font-medium tracking-widest uppercase mb-1">
              SR Patil Infrastructure Private Limited
            </p>
            <p className="text-xs text-blue-300 opacity-70">Hiresnix AI Academy</p>
          </div>

          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400 mb-1">This certifies that</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {data.student_name}
            </h2>
            <p className="text-sm text-gray-400 mb-2">has successfully completed</p>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
              {data.course_title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              on Hiresnix AI Academy
            </p>
          </div>

          {/* Details */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Issue date</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{issuedDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Certificate ID</span>
              <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{data.verify_hash}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Issued by</span>
              <span className="text-gray-700 dark:text-gray-300">SR Patil Infrastructure Pvt Ltd</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Location</span>
              <span className="text-gray-700 dark:text-gray-300">Shirpur, Maharashtra</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Verified by hiresnix.co.in
            </span>
            {data.pdf_url && (
              <a
                href={data.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="text-blue-500 hover:underline">hiresnix.co.in</Link>
          {' · '}Empowering India's Next Generation of Tech Professionals
        </p>
      </div>
    </div>
  )
}