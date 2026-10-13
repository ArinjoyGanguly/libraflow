import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage: React.FC = () => {
  // Meaningful statistics calculated directly from seed dataset
  const loanDistributionData = [
    { name: 'Active Loans', count: 4, fill: '#10b981' },
    { name: 'Overdue Loans', count: 1, fill: '#f43f5e' },
    { name: 'Returned Loans', count: 1, fill: '#64748b' },
  ];

  const genreDistributionData = [
    { name: 'Fiction', value: 7, color: '#6366f1' },
    { name: 'Mythology', value: 5, color: '#8b5cf6' },
    { name: 'Short Stories', value: 4, color: '#0ea5e9' },
    { name: 'Literary Fiction', value: 3, color: '#ec4899' },
  ];

  const branchCapacityData = [
    { name: 'Central City (LIB01)', totalCopies: 10, borrowed: 3 },
    { name: 'North Campus (LIB02)', totalCopies: 9, borrowed: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Library Analytics & Circulation Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational distribution and inventory health calculated from domain graph records
          </p>
        </div>

        <Badge variant="purple">DBMS Assignment DA3</Badge>
      </div>

      {/* Honest Boundary Banner */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">Phase 6 Metric Foundation:</strong> Visualizing
          verified baseline distributions from <code className="text-indigo-300">seed.cypher</code>.
          Dynamic live Neo4j aggregations (<code className="text-indigo-300">GET /api/admin/stats</code>)
          will bind in Phase 7.
        </span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circulation Status Breakdown */}
        <Card
          title="Circulation Lifecycle Distribution"
          subtitle="Status breakdown across all loans (:Loan {status: ...})"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanDistributionData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {loanDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Active (4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Overdue (1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
              <span>Returned (1)</span>
            </div>
          </div>
        </Card>

        {/* Catalog Volume Distribution by Genre */}
        <Card
          title="Volume Inventory by Genre"
          subtitle="Physical copy allocation per literary genre classification"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genreDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genreDistributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Branch Capacity Metrics */}
      <Card
        title="Campus Branch Holdings & Circulation Balance"
        subtitle="Holdings vs active borrowings across physical branches"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branchCapacityData.map((branch) => {
            const utilizationPct = Math.round((branch.borrowed / branch.totalCopies) * 100);
            return (
              <div
                key={branch.name}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200">{branch.name}</h4>
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    {utilizationPct}% Borrowed
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{branch.borrowed} Copies with Students</span>
                  <span>{branch.totalCopies - branch.borrowed} on Shelf</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
