import React, { useState } from 'react';
import { Building2, Plus, MapPin, Phone, Mail, BookOpen, Users } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { SEED_LIBRARIES } from '../services/seedData';

export const LibrariesPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLib, setNewLib] = useState({
    libraryId: `LIB0${SEED_LIBRARIES.length + 1}`,
    name: '',
    address: '',
    city: 'Bengaluru',
    phone: '',
    email: '',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Library Branches & Campuses
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical campus branch locations managing book holdings and staff allocations
          </p>
        </div>

        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Branch
        </Button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SEED_LIBRARIES.map((lib) => (
          <Card
            key={lib.libraryId}
            title={
              <div className="flex items-center gap-2">
                <span>{lib.name}</span>
                <Badge variant="purple" size="sm">
                  {lib.libraryId}
                </Badge>
              </div>
            }
            subtitle={`${lib.city} Campus Division`}
            footer={
              <div className="flex items-center justify-between w-full text-xs text-slate-400">
                <span className="font-mono">Holdings Node: (:Library)</span>
                <span className="text-emerald-400 font-medium">Operational</span>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{lib.address}, {lib.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{lib.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{lib.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-base font-bold font-mono text-white">
                      {lib.booksCount ?? 10}
                    </div>
                    <div className="text-[11px] text-slate-400">Physical Titles</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/60">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-base font-bold font-mono text-white">
                      {lib.employeesCount ?? 2}
                    </div>
                    <div className="text-[11px] text-slate-400">Assigned Staff</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Branch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Campus Branch"
        subtitle="Creates a (:Library) node with relational bindings"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                alert(`Branch ${newLib.name} (${newLib.libraryId}) validated for Phase 7 API creation.`);
              }}
            >
              Register Branch
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Branch ID" value={newLib.libraryId} disabled />
          <Input
            label="Branch Name"
            placeholder="e.g. South Campus Science Library"
            value={newLib.name}
            onChange={(e) => setNewLib({ ...newLib, name: e.target.value })}
            required
          />
          <Input
            label="Street Address"
            placeholder="e.g. 45 Outer Ring Road"
            value={newLib.address}
            onChange={(e) => setNewLib({ ...newLib, address: e.target.value })}
            required
          />
          <Input
            label="City"
            value={newLib.city}
            onChange={(e) => setNewLib({ ...newLib, city: e.target.value })}
            required
          />
          <Input
            label="Telephone"
            placeholder="+91-80-22001300"
            value={newLib.phone}
            onChange={(e) => setNewLib({ ...newLib, phone: e.target.value })}
          />
          <Input
            label="Official Email"
            placeholder="south@libraflow.edu"
            value={newLib.email}
            onChange={(e) => setNewLib({ ...newLib, email: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};
