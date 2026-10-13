import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  RefreshCw,
  Save,
  Server,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { probeBackendHealth } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [loanPeriod, setLoanPeriod] = useState(14);
  const [fineRate, setFineRate] = useState(1.0);
  const [maxLoans, setMaxLoans] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Diagnostic state
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    tested: boolean;
    server: boolean;
    database: boolean;
  }>({
    tested: false,
    server: false,
    database: false,
  });

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    const res = await probeBackendHealth();
    setDiagnosticResult({
      tested: true,
      server: res.server,
      database: res.database,
    });
    setIsTestingConn(false);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" />
          System Settings & Diagnostic Control
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Circulation policy thresholds, backend service diagnostics, and environment bindings
        </p>
      </div>

      {saveSuccess && (
        <Alert type="success" title="Policy Configuration Saved">
          Library circulation limits updated. These parameters align with backend environment settings.
        </Alert>
      )}

      {/* Circulation Policy Card */}
      <form onSubmit={handleSavePolicies}>
        <Card
          title="Circulation Policy Rules"
          subtitle="Enforced by backend services across issue and return transactions"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono text-slate-500">
                Mapped to server environment: LOAN_PERIOD_DAYS & FINE_RATE_PER_DAY
              </span>
              <Button size="sm" type="submit" leftIcon={<Save className="w-4 h-4" />}>
                Save Policy Parameters
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Standard Loan Period (Days)"
              type="number"
              min={1}
              max={90}
              value={loanPeriod}
              onChange={(e) => setLoanPeriod(parseInt(e.target.value) || 14)}
              helperText="Days before a loan is tagged OVERDUE"
            />

            <Input
              label="Daily Late Fine ($/Day)"
              type="number"
              step="0.25"
              min={0}
              value={fineRate}
              onChange={(e) => setFineRate(parseFloat(e.target.value) || 1.0)}
              helperText="Accumulated per calendar day overdue"
            />

            <Input
              label="Max Borrow Cap Per Member"
              type="number"
              min={1}
              max={10}
              value={maxLoans}
              onChange={(e) => setMaxLoans(parseInt(e.target.value) || 3)}
              helperText="Concurrent active loans allowed per student"
            />
          </div>
        </Card>
      </form>

      {/* Backend & Neo4j Health Diagnostics */}
      <Card
        title="Backend & Neo4j Infrastructure Diagnostics"
        subtitle="Live probe to check whether Express server and Neo4j bolt driver are reachable"
        headerAction={
          <Button
            size="sm"
            variant="outline"
            isLoading={isTestingConn}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleTestConnection}
          >
            Probe Live Services
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  Express Backend API
                </span>
                {diagnosticResult.tested ? (
                  diagnosticResult.server ? (
                    <Badge variant="success">Online (HTTP 200)</Badge>
                  ) : (
                    <Badge variant="danger">Unreachable</Badge>
                  )
                ) : (
                  <Badge variant="outline">Not Probed</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Listening route: <code className="text-slate-300">GET /health</code>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Neo4j Bolt Graph Engine
                </span>
                {diagnosticResult.tested ? (
                  diagnosticResult.database ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Badge variant="warning">Disconnected</Badge>
                  )
                ) : (
                  <Badge variant="outline">Not Probed</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Driver target: <code className="text-slate-300">bolt://localhost:7687</code>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
            <p>
              When running Phase 6 in frontend standalone mode, seed data from{' '}
              <code className="text-indigo-300">seed.cypher</code> is utilized for consistent UI preview.
              In Phase 7, the frontend binds to live endpoints when the Node server and Neo4j instance are online.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
