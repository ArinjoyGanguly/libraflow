import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  ShieldAlert,
  History,
  Mail,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { SEED_MEMBERS } from '../services/seedData';
import type { Member } from '../types';

export const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [newMember, setNewMember] = useState({
    memberId: `M00${SEED_MEMBERS.length + 1}`,
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const filteredMembers = SEED_MEMBERS.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.memberId.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'memberId',
      header: 'Member ID',
      render: (m: Member) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">{m.memberId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Full Name & Email',
      render: (m: Member) => (
        <div>
          <div className="font-medium text-slate-100">{m.name}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3 h-3 text-slate-500" />
            <span>{m.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact & Address',
      render: (m: Member) => (
        <div className="text-xs text-slate-400">
          <div>{m.phone}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{m.address}</div>
        </div>
      ),
    },
    {
      key: 'joinDate',
      header: 'Joined',
      render: (m: Member) => (
        <span className="text-xs font-mono text-slate-400">{m.joinDate}</span>
      ),
    },
    {
      key: 'activeLoansCount',
      header: 'Active Loans',
      render: (m: Member) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-200">
          {m.activeLoansCount ?? 0} borrowed
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m: Member) => (
        <Badge variant={m.status === 'ACTIVE' ? 'success' : 'danger'}>
          {m.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (m: Member) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/loans?memberId=${m.memberId}`)}
            title="View borrowing history"
          >
            <History className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMember(m)}
          >
            Profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Registered Members
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student and faculty library accounts, borrowing limits, and standing statuses
          </p>
        </div>

        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Register Member
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by member ID, student name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'SUSPENDED')}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Members' },
                { value: 'SUSPENDED', label: 'Suspended (Fines/Hold)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-500" />}
          title="No Members Found"
          description="Try modifying your search criteria or resetting filters."
        />
      ) : (
        <Table
          columns={columns}
          data={filteredMembers}
          keyExtractor={(m) => m.memberId}
        />
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Member Profile: ${selectedMember.name}`}
          subtitle={`ID: ${selectedMember.memberId} • Status: ${selectedMember.status}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const mId = selectedMember.memberId;
                  setSelectedMember(null);
                  navigate(`/loans?memberId=${mId}`);
                }}
                leftIcon={<History className="w-3.5 h-3.5" />}
              >
                View Borrowing History
              </Button>
              <Button size="sm" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {selectedMember.status === 'SUSPENDED' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                <span>
                  Member account is <strong>SUSPENDED</strong>. The server rejects new loan issuance (<code className="text-rose-200">403 Forbidden</code>) until unreturned volumes and fines are settled.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Email Address</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedMember.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Phone Number</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedMember.phone}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Campus Address</span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedMember.address}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400">Account Registered On</span>
              <span className="font-mono text-slate-200">{selectedMember.joinDate}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student Member"
        subtitle="Creates a (:Member) node with encrypted credentials"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                alert(`Member ${newMember.name} (${newMember.memberId}) validated for Phase 7 backend registration.`);
              }}
            >
              Confirm Registration
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Member ID"
            value={newMember.memberId}
            disabled
            helperText="Auto-assigned next sequence ID"
          />
          <Input
            label="Full Name"
            placeholder="e.g. Vikram Seth"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="vikram.s@student.edu"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+91-98765-00000"
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
          />
          <Input
            label="Hostel / Campus Address"
            placeholder="Room 204, North Block"
            value={newMember.address}
            onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};
