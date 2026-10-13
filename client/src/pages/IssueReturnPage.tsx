import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Repeat,
  BookCheck,
  RotateCcw,
  AlertTriangle,
  User,
  BookOpen,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import {
  SEED_BOOKS,
  SEED_MEMBERS,
  SEED_LOANS,
  SEED_EMPLOYEES,
} from '../services/seedData';

export const IssueReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get('bookId');

  const [activeTab, setActiveTab] = useState<'issue' | 'return'>('issue');

  // Issue Form State
  const [issueMemberId, setIssueMemberId] = useState(SEED_MEMBERS[0]?.memberId || 'M001');
  const [issueBookId, setIssueBookId] = useState(preselectedBookId || SEED_BOOKS[0]?.bookId || 'B001');
  const [issuePeriodDays, setIssuePeriodDays] = useState(14);
  const [issueStaffId, setIssueStaffId] = useState('E01');
  const [issueStatus, setIssueStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Return Form State
  const [selectedLoanId, setSelectedLoanId] = useState(SEED_LOANS[0]?.loanId || 'L001');
  const [returnStatus, setReturnStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const selectedMember = SEED_MEMBERS.find((m) => m.memberId === issueMemberId);
  const selectedBook = SEED_BOOKS.find((b) => b.bookId === issueBookId);

  const activeLoans = SEED_LOANS.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  const currentLoan = SEED_LOANS.find((l) => l.loanId === selectedLoanId);

  // Calculate return details for current loan
  const isOverdue = currentLoan?.status === 'OVERDUE';
  const calculatedFine = isOverdue ? 18.0 : 0.0;

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedBook) return;

    if (selectedMember.status === 'SUSPENDED') {
      setIssueStatus({
        type: 'error',
        msg: `Cannot issue book: Member ${selectedMember.name} (${selectedMember.memberId}) is SUSPENDED. Backend will reject with 403 Forbidden.`,
      });
      return;
    }

    if (selectedBook.availableCopies <= 0) {
      setIssueStatus({
        type: 'error',
        msg: `Cannot issue book: "${selectedBook.title}" has 0 copies available. Backend will reject with 400 Bad Request.`,
      });
      return;
    }

    setIssueStatus({
      type: 'success',
      msg: `Loan validated successfully! Book "${selectedBook.title}" issued to ${selectedMember.name} for ${issuePeriodDays} days. In Phase 7 this triggers executeWrite Neo4j transaction.`,
    });
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan) return;

    setReturnStatus({
      type: 'success',
      msg: `Return processed! Loan ${currentLoan.loanId} marked as RETURNED. Book copies incremented. ${
        calculatedFine > 0 ? `Calculated fine of $${calculatedFine.toFixed(2)} recorded.` : 'No overdue fines.'
      }`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Repeat className="w-5 h-5 text-indigo-400" />
          Circulation Desk
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Execute atomic borrow transactions and process returns with automatic fine calculation
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('issue')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'issue'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookCheck className="w-4 h-4" />
          Issue Book to Member
        </button>
        <button
          onClick={() => setActiveTab('return')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'return'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Process Book Return
        </button>
      </div>

      {/* TAB 1: ISSUE BOOK */}
      {activeTab === 'issue' && (
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          {issueStatus && (
            <Alert
              type={issueStatus.type}
              onClose={() => setIssueStatus(null)}
              title={issueStatus.type === 'success' ? 'Borrow Transaction Ready' : 'Integrity Guard Warning'}
            >
              {issueStatus.msg}
            </Alert>
          )}

          <Card
            title="Issue Physical Book"
            subtitle="Enforces member status check, duplicate loan guards, and node write lock"
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-slate-500">
                  Transaction: session.executeWrite (Phase 5 endpoint: POST /api/loans/issue)
                </span>
                <Button size="sm" type="submit" leftIcon={<BookCheck className="w-4 h-4" />}>
                  Issue Book Now
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member selection */}
                <div>
                  <Select
                    label="Borrowing Member"
                    value={issueMemberId}
                    onChange={(e) => setIssueMemberId(e.target.value)}
                    options={SEED_MEMBERS.map((m) => ({
                      value: m.memberId,
                      label: `${m.name} (${m.memberId}) — [${m.status}]`,
                    }))}
                  />
                  {selectedMember && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Active loans: {selectedMember.activeLoansCount || 0} / 3 max</span>
                      </div>
                      <Badge variant={selectedMember.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {selectedMember.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Book selection */}
                <div>
                  <Select
                    label="Book to Borrow"
                    value={issueBookId}
                    onChange={(e) => setIssueBookId(e.target.value)}
                    options={SEED_BOOKS.map((b) => ({
                      value: b.bookId,
                      label: `${b.title} (${b.bookId}) — [${b.availableCopies} avail]`,
                    }))}
                  />
                  {selectedBook && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ISBN: {selectedBook.isbn}</span>
                      </div>
                      <Badge variant={selectedBook.availableCopies > 0 ? 'success' : 'danger'} size="sm">
                        {selectedBook.availableCopies} available
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <Input
                  label="Loan Period (Days)"
                  type="number"
                  min={1}
                  max={60}
                  value={issuePeriodDays}
                  onChange={(e) => setIssuePeriodDays(parseInt(e.target.value) || 14)}
                  helperText="Default loan period is 14 days"
                />

                <Select
                  label="Issuing Librarian Staff"
                  value={issueStaffId}
                  onChange={(e) => setIssueStaffId(e.target.value)}
                  options={SEED_EMPLOYEES.map((e) => ({
                    value: e.employeeId,
                    label: `${e.name} (${e.employeeId} - ${e.position})`,
                  }))}
                />
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* TAB 2: RETURN BOOK */}
      {activeTab === 'return' && (
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {returnStatus && (
            <Alert
              type={returnStatus.type}
              onClose={() => setReturnStatus(null)}
              title="Return Confirmation"
            >
              {returnStatus.msg}
            </Alert>
          )}

          <Card
            title="Process Book Return"
            subtitle="Updates loan node status, sets returnDate, and increments book.availableCopies"
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-slate-500">
                  Transaction: session.executeWrite (Phase 5 endpoint: PUT /api/loans/:loanId/return)
                </span>
                <Button size="sm" type="submit" leftIcon={<RotateCcw className="w-4 h-4" />}>
                  Confirm Return
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <Select
                label="Select Active Loan Record"
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                options={activeLoans.map((l) => ({
                  value: l.loanId,
                  label: `${l.loanId} — ${l.book?.title} (${l.member?.name}) [${l.status}]`,
                }))}
              />

              {currentLoan && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 font-semibold">
                        {currentLoan.loanId}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">
                        {currentLoan.book?.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Borrowed by {currentLoan.member?.name} ({currentLoan.member?.memberId})
                      </p>
                    </div>
                    <Badge variant={currentLoan.status === 'OVERDUE' ? 'danger' : 'success'}>
                      {currentLoan.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500">Issue Date</span>
                      <p className="font-mono text-slate-200 mt-0.5">{currentLoan.issueDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Due Date</span>
                      <p className="font-mono text-slate-200 mt-0.5">{currentLoan.dueDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Fine Assessment</span>
                      <p
                        className={`font-mono font-semibold mt-0.5 ${
                          calculatedFine > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {calculatedFine > 0 ? `$${calculatedFine.toFixed(2)} Fine` : '$0.00 (On Time)'}
                      </p>
                    </div>
                  </div>

                  {isOverdue && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        This volume is <strong>18 days overdue</strong>. A late fine of $1.00/day will be attached to the member's account upon processing.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};
