// src/pages/student/StudentResources.tsx
import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Resource } from '../../types';
import { Video, FileText, ExternalLink, Search } from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  Video: Video,
  Note: FileText,
  Article: FileText,
  PDF: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  Video: 'bg-red-100 text-red-600',
  Note: 'bg-blue-100 text-blue-600',
  Article: 'bg-green-100 text-green-600',
  PDF: 'bg-orange-100 text-orange-600',
};

export function StudentResources() {
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('');

  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      const res = await client.get('/admin/hub-resources');
      setAllResources(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load resources');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  let resources = allResources;
  if (search) resources = resources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
  if (domain) resources = resources.filter(r => r.domain?.toLowerCase().includes(domain.toLowerCase()));
  if (type) resources = resources.filter(r => r.type === type);

  // Group by domain
  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const key = r.domain || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={fetchResources} />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Resource Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Curated learning materials to boost your career</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>
        <input
          type="text" placeholder="Filter by domain..."
          value={domain}
          onChange={e => setDomain(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white sm:w-44"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All Types</option>
          <option value="Video">Video</option>
          <option value="Note">Note</option>
          <option value="Article">Article</option>
          <option value="PDF">PDF</option>
        </select>
      </div>

      {resources.length === 0 ? (
        <EmptyState title="No resources found" description="Try adjusting your filters" />
      ) : Object.entries(grouped).map(([domainName, items]) => (
        <div key={domainName}>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            {domainName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(resource => {
              const Icon = TYPE_ICONS[resource.type] || FileText;
              return (
                <a
                  key={resource.id}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[resource.type] || 'bg-gray-100 text-gray-600'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2">{resource.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{resource.category}</p>
                      {resource.badge && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">{resource.badge}</span>
                      )}
                    </div>
                    <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-400 transition shrink-0 mt-0.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
