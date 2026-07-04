import client from './client';

export type VerificationType = 'certificate' | 'offer-letter' | 'recommendation-letter';

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
};

export const verificationApi = {
  verify: async (type: VerificationType, id: string): Promise<VerificationRecord> => {
    const res = await client.get(`${endpoints[type]}/${encodeURIComponent(id.trim())}`);
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
