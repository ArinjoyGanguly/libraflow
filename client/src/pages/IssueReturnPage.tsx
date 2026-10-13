import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Repeat,
  BookCheck,
  RotateCcw,
  AlertTriangle,
  User,
  BookOpen,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Book, Member, Employee, Loan, OverdueLoan } from '../types';

export const IssueReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get('bookId');
  const preselectedMemberId = searchParams.get('memberId');

  const [activeTab, setActiveTab] = useState<'issue' | 'return'>('issue');

  // Datasets from API
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Issue Form State
  const [issueMemberId, setIssueMemberId] = useState('');
  const [issueBookId, setIssueBookId] = useState('');
  const [issuePeriodDays, setIssuePeriodDays] = useState(14);
  const [issueStaffId, setIssueStaffId] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueStatus, setIssueStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Return Form State
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [returnStatus, setReturnStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchCirculationData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [membersRes, booksRes, staffRes, activeLoansRes, overdueLoansRes] = await Promise.all([
        api.members.list({ limit: 100 }),
        api.books.list({ limit: 100 }),
        api.employees.list({ limit: 100 }),
        api.loans.list({ status: 'ACTIVE', limit: 100 }),
        api.loans.overdue(),
      ]);

      const memList = membersRes.success && membersRes.data
        ? (Array.isArray(membersRes.data) ? membersRes.data : membersRes.data.items || [])
        : [];
      const bkList = booksRes.success && booksRes.data
        ? (Array.isArray(booksRes.data) ? booksRes.data : booksRes.data.items || [])
        : [];
      const staffList = staffRes.success && staffRes.data
        ? (Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.items || [])
        : [];
      const actLoans = activeLoansRes.success && activeLoansRes.data
        ? (Array.isArray(activeLoansRes.data) ? activeLoansRes.data : activeLoansRes.data.items || [])
        : [];
      const ovdLoans = overdueLoansRes.success && overdueLoansRes.data
        ? (Array.isArray(overdueLoansRes.data) ? overdueLoansRes.data : [])
        : [];

      setMembers(memList);
      setBooks(bkList);
      setEmployees(staffList);
      setActiveLoans(actLoans);
      setOverdueLoans(ovdLoans);

      // Preselect form defaults
      if (memList.length > 0 && !issueMemberId) {
        setIssueMemberId(preselectedMemberId || memList[0].memberId);
      }
      if (bkList.length > 0 && !issueBookId) {
        setIssueBookId(preselectedBookId || bkList[0].bookId);
      }
      if (staffList.length > 0 && !issueStaffId) {
        setIssueStaffId(staffList[0].employeeId);
      }
      if (actLoans.length > 0 && !selectedLoanId) {
        setSelectedLoanId(actLoans[0].loanId);
      }

      if (!membersRes.success && !booksRes.success) {
        setFetchError('Unable to load circulation records from server. Check backend connection.');
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Network error loading circulation data.');
    } finally {
      setLoading(false);
    }
  }, [issueMemberId, issueBookId, issueStaffId, selectedLoanId, preselectedMemberId, preselectedBookId]);

  useEffect(() => {
    fetchCirculationData();
  }, [fetchCirculationData]);

  const selectedMember = members.find((m) => m.memberId === issueMemberId);
  const selectedBook = books.find((b) => b.bookId === issueBookId);

  // Return state calculations
  const allReturnableLoans: Array<Loan | OverdueLoan> = [
    ...activeLoans,
    ...overdueLoans.filter((o) => !activeLoans.some((a) => a.loanId === o.loanId)),
  ];
  const currentLoan = allReturnableLoans.find((l) => l.loanId === selectedLoanId);
  const isOverdue = currentLoan?.status === 'OVERDUE' || overdueLoans.some((o) => o.loanId === selectedLoanId);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isIssuing) return;
    setIssueStatus(null);

    if (!selectedMember || !selectedBook) {
      setIssueStatus({ type: 'error', msg: 'Please select both an active member and an available book.' });
      return;
    }

    if (selectedMember.status === 'SUSPENDED') {
      setIssueStatus({
        type: 'error',
        msg: `Cannot issue book: Member ${selectedMember.name} (${selectedMember.memberId}) is SUSPENDED.`,
      });
      return;
    }

    if (selectedBook.availableCopies <= 0) {
      setIssueStatus({
        type: 'error',
        msg: `Cannot issue book: "${selectedBook.title}" currently has 0 copies available.`,
      });
      return;
    }

    setIsIssuing(true);
    try {
      const res = await api.loans.issue({
        memberId: selectedMember.memberId,
        bookId: selectedBook.bookId,
        employeeId: issueStaffId || undefined,
        loanPeriodDays: issuePeriodDays,
      });

      if (res.success && res.data) {
        setIssueStatus({
          type: 'success',
          msg: `Success! Loan ${res.data.loanId} created. "${selectedBook.title}" issued to ${selectedMember.name}. Due on ${res.data.dueDate}.`,
        });
        // Refresh data to reflect updated available copies and active loans
        fetchCirculationData();
      } else {
        setIssueStatus({
          type: 'error',
          msg: res.error || 'The server rejected this loan request.',
        });
      }
    } catch (err) {
      setIssueStatus({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Network error during loan transaction.',
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReturning) return;
    setReturnStatus(null);

    if (!currentLoan) {
      setReturnStatus({ type: 'error', msg: 'Please select an active loan to return.' });
      return;
    }

    setIsReturning(true);
    try {
      const res = await api.loans.return(currentLoan.loanId, {
        returnDate: new Date().toISOString().split('T')[0],
      });

      if (res.success && res.data) {
        const fineText = res.data.fineAmount && res.data.fineAmount > 0
          ? ` A late fine of $${res.data.fineAmount.toFixed(2)} was assessed.`
          : ' No overdue fines.';
        setReturnStatus({
          type: 'success',
          msg: `Return confirmed! Loan ${currentLoan.loanId} marked as RETURNED.${fineText} Book copy returned to inventory.`,
        });
        // Refresh data to update inventory and active loan lists
        fetchCirculationData();
      } else {
        setReturnStatus({
          type: 'error',
          msg: res.error || 'Server rejected loan return.',
        });
      }
    } catch (err) {
      setReturnStatus({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Network error during loan return transaction.',
      });
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            Circulation Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute atomic borrow transactions and process returns with automatic fine calculation
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchCirculationData}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <Alert type="error" title="Backend Connection Warning" onClose={() => setFetchError(null)}>
          <div className="flex items-center justify-between">
            <span>{fetchError}</span>
            <Button size="sm" variant="outline" onClick={fetchCirculationData} className="ml-4">
              Retry
            </Button>
          </div>
        </Alert>
      )}

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
          Process Book Return ({allReturnableLoans.length})
        </button>
      </div>

      {/* TAB 1: ISSUE BOOK */}
      {activeTab === 'issue' && (
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          {issueStatus && (
            <Alert
              type={issueStatus.type}
              onClose={() => setIssueStatus(null)}
              title={issueStatus.type === 'success' ? 'Loan Issued Successfully' : 'Transaction Prevented'}
            >
              {issueStatus.msg}
            </Alert>
          )}

          <Card
            title="Issue Physical Book"
            subtitle="Executes atomic write transaction in Neo4j with status and concurrency guards"
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-slate-500">
                  Target API: POST /api/loans/issue
                </span>
                <Button
                  size="sm"
                  type="submit"
                  isLoading={isIssuing}
                  disabled={isIssuing || loading || !selectedMember || !selectedBook || selectedBook.availableCopies <= 0 || selectedMember.status === 'SUSPENDED'}
                  leftIcon={<BookCheck className="w-4 h-4" />}
                >
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
                    options={members.map((m) => ({
                      value: m.memberId,
                      label: `${m.name} (${m.memberId}) — [${m.status}]`,
                    }))}
                  />
                  {selectedMember && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Active loans: {selectedMember.activeLoansCount || 0} / 3 cap</span>
                      </div>
                      <Badge variant={selectedMember.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {selectedMember.status}
                      </Badge>
                    </div>
                  )}
                  {selectedMember?.status === 'SUSPENDED' && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      Member is suspended. Cannot issue books until clear.
                    </p>
                  )}
                </div>

                {/* Book selection */}
                <div>
                  <Select
                    label="Book to Borrow"
                    value={issueBookId}
                    onChange={(e) => setIssueBookId(e.target.value)}
                    options={books.map((b) => ({
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
                  {selectedBook && selectedBook.availableCopies <= 0 && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      No copies remaining in catalog. Cannot issue.
                    </p>
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
                  helperText="Standard loan period is 14 days"
                />

                <Select
                  label="Issuing Librarian Staff"
                  value={issueStaffId}
                  onChange={(e) => setIssueStaffId(e.target.value)}
                  options={employees.map((e) => ({
                    value: e.employeeId,
                    label: `${e.name} (${e.employeeId} - ${e.position || 'Staff'})`,
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
              title={returnStatus.type === 'success' ? 'Return Confirmed' : 'Return Request Failed'}
            >
              {returnStatus.msg}
            </Alert>
          )}

          <Card
            title="Process Book Return"
            subtitle="Updates loan node status, sets returnDate, and increments inventory copy"
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-slate-500">
                  Target API: PUT /api/loans/:loanId/return
                </span>
                <Button
                  size="sm"
                  type="submit"
                  isLoading={isReturning}
                  disabled={isReturning || loading || !currentLoan}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Confirm Return
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              {allReturnableLoans.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-medium">No active or overdue loans currently found.</p>
                  <p className="text-xs text-slate-500 mt-1">All borrowed volumes have been checked in.</p>
                </div>
              ) : (
                <>
                  <Select
                    label="Select Active Loan Record"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    options={allReturnableLoans.map((l) => ({
                      value: l.loanId,
                      label: `${l.loanId} — ${l.book?.title || 'Unknown Title'} (${l.member?.name || l.member?.memberId || 'Borrower'}) [${l.status}]`,
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
                        <Badge variant={isOverdue ? 'danger' : 'success'}>
                          {isOverdue ? 'OVERDUE' : currentLoan.status}
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
                          <span className="text-slate-500">Overdue Status</span>
                          <p
                            className={`font-mono font-semibold mt-0.5 ${
                              isOverdue ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isOverdue ? 'Overdue Fine Applicable' : 'On Time'}
                          </p>
                        </div>
                      </div>

                      {isOverdue && (
                        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            This volume is past its due date. Late fines are calculated dynamically by the server upon return submission.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};
