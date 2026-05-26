// src/api/analytics.ts
import client from './client';

export const analyticsApi = {
  getOverview: async () => {
    const res = await client.get('/admin/analytics');
    return res.data;
  },
  getCgpaPlacement: async () => {
    const res = await client.get('/analytics/cgpa-placement');
    return res.data;
  },
  getSkillDemand: async () => {
    const res = await client.get('/analytics/skill-demand');
    return res.data;
  },
  getSalaryDistribution: async () => {
    const res = await client.get('/analytics/salary-distribution');
    return res.data;
  },
  getDepartmentStats: async () => {
    const res = await client.get('/analytics/department-stats');
    return res.data;
  },
  getPlacementTrends: async (year?: number) => {
    const res = await client.get('/analytics/placement-trends', { params: { year } });
    return res.data;
  },
  getCompanyStats: async () => {
    const res = await client.get('/analytics/company-stats');
    return res.data;
  },
};
