import { useState, useCallback, useEffect } from 'react'
import { getCertificate } from '../../lib/academy/academySupabase'
import { checkAndIssueCertificate } from './certificateUtils'
import type { Certificate } from '../../lib/academy/academyTypes'

interface UseCertificateOptions {
  userId: string
  courseId: string
  studentName: string
  courseTitle: string
}

export function useCertificate({
  userId,
  courseId,
  studentName,
  courseTitle,
}: UseCertificateOptions) {
  const [certificate, setCertificate]     = useState<Certificate | null>(null)
  const [isChecking, setIsChecking]       = useState(false)
  const [isGenerating, setIsGenerating]   = useState(false)
  const [justIssued, setJustIssued]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  // Load existing certificate on mount
  useEffect(() => {
    if (!userId || !courseId) return
    getCertificate(userId, courseId)
      .then(cert => setCertificate(cert))
      .catch(console.error)
  }, [userId, courseId])

  // Check completion + auto-issue
  const checkAndIssue = useCallback(async () => {
    if (!userId || !courseId || !studentName || isGenerating) return
    setIsChecking(true)
    setError(null)

    try {
      const result = await checkAndIssueCertificate(
        userId, courseId, studentName, courseTitle
      )

      if (!result) {
        // Course not yet complete
        setIsChecking(false)
        return
      }

      if (result.issued) {
        setJustIssued(true)
        // Reload certificate from DB
        const cert = await getCertificate(userId, courseId)
        setCertificate(cert)
      }
      // If !result.issued → already existed, do nothing (already loaded in useEffect)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue certificate')
    } finally {
      setIsChecking(false)
    }
  }, [userId, courseId, studentName, courseTitle, isGenerating])

  // Download existing certificate as PDF (re-generate client-side)
  const downloadPDF = useCallback(async () => {
    if (!certificate || isGenerating) return
    setIsGenerating(true)

    try {
      const { generateCertificatePDF } = await import('./certificateUtils')
      const { jsPDF } = await import('jspdf')

      const pdf = generateCertificatePDF({
        studentName,
        courseTitle,
        completionDate: new Date(certificate.issued_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
        verifyHash: certificate.verify_hash,
        certificateId: certificate.verify_hash,
      })

      pdf.save(`${courseTitle.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }, [certificate, studentName, courseTitle, isGenerating])

  return {
    certificate,
    isChecking,
    isGenerating,
    justIssued,
    error,
    checkAndIssue,
    downloadPDF,
  }
}
