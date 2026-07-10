import client from './client';

export type VerificationType = 'certificate' | 'offer-letter' | 'recommendation-letter' | 'skill-assessment' | 'course-completion';

export type VerificationRecord = {
  valid: boolean;
  studentName?: string;
  issueDate?: string;
  internshipDomain?: string;
  documentId?: string;
  documentType?: string;
};

const endpoints: Record<VerificationType, string> = {
  certificate: '/iplatform/verify',
  'offer-letter': '/iplatform/verify-offer',
  'recommendation-letter': '/iplatform/verify-recommendation',
  'skill-assessment': '/iplatform/verify-inst-cert',
  'course-completion': '/iplatform/verify-inst-cert',
};

const getLookupIds = (type: VerificationType, id: string) => {
  const trimmed = id.trim();
  if (type !== 'offer-letter') return [trimmed];

  const upper = trimmed.toUpperCase();
  return Array.from(new Set([
    trimmed,
    upper,
    upper.replace(/^HSH-INT-/i, 'HSN-INT-'),
    upper.replace(/^HSN-INT-/i, 'HSH-INT-'),
  ]));
};

export const verificationApi = {
  verify: async (type: VerificationType, id: string): Promise<VerificationRecord> => {
    const lookupIds = getLookupIds(type, id);
    let res;
    let lastError;

    for (const lookupId of lookupIds) {
      try {
        res = await client.get(`${endpoints[type]}/${encodeURIComponent(lookupId)}`);
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!res) throw lastError;

    const data = res.data?.data || {};

    return {
      valid: Boolean(res.data?.valid ?? data.isValid ?? true),
      studentName: data.studentName || data.candidateName || data.application?.studentName,
      issueDate: data.issueDate || data.issuedAt || data.offerLetterDate || data.completedAt || data.createdAt,
      internshipDomain: data.internshipDomain || data.domainName || data.role || data.domain?.name,
      documentId: data.documentId || data.certificateNo || data.offerLetterId || id,
      documentType: data.documentType,
    };
  },
};