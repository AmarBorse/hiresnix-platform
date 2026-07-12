import { useEffect } from 'react'
import { useCertificate } from '../../../hooks/academy/useCertificate'
import type { CourseProgress } from '../../../hooks/academy/progressQueries'

interface CertificateBannerProps {
  userId: string
  studentName: string
  courseId: string
  courseTitle: string
  courseProgress: CourseProgress | null
}

export default function CertificateBanner({
  userId,
  studentName,
  courseId,
  courseTitle,
  courseProgress,
}: CertificateBannerProps) {
  const {
    certificate,
    isChecking,
    isGenerating,
    justIssued,
    error,
    checkAndIssue,
    downloadPDF,
  } = useCertificate({ userId, courseId, studentName, courseTitle })

  // Auto-trigger when course hits 100%
  useEffect(() => {
    if (courseProgress?.percent === 100 && !certificate && userId && studentName) {
      checkAndIssue()
    }
  }, [courseProgress?.percent, certificate, userId, studentName])

  // Nothing to show if course not complete and no cert
  if (!certificate && courseProgress?.percent !== 100) return null

  // Checking / generating state
  if (isChecking) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Verifying completion and generating your certificate...
        </p>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">⚠ {error}</p>
        <button
          onClick={checkAndIssue}
          className="text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!certificate) return null

  return (
    <div className={`rounded-xl border p-5 ${
      justIssued
        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border-amber-300 dark:border-amber-700'
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="text-4xl">🏆</div>
          <div>
            {justIssued ? (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-0.5">
                  Congratulations! Certificate issued! 🎉
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You've completed <span className="font-medium">{courseTitle}</span>.
                  Your certificate is ready to download.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-0.5">
                  Course Certificate
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Issued on{' '}
                  {new Date(certificate.issued_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </>
            )}

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">
                ID: {certificate.verify_hash}
              </span>
              <a
                href={`/verify/${certificate.verify_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Verify online ↗
              </a>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {certificate.pdf_url && (
            <a
              href={certificate.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600
                dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </a>
          )}
          <button
            onClick={downloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600
              text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
