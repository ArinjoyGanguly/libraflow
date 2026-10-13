import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { SEED_BOOKS } from '../services/seedData';
import type { Book } from '../types';

export const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE'>('ALL');
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  const genres = ['ALL', 'Fiction', 'Mythology', 'Literary Fiction', 'Short Stories'];

  const filteredBooks = SEED_BOOKS.filter((book) => {
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn.toLowerCase().includes(search.toLowerCase()) ||
      (book.author?.name && book.author.name.toLowerCase().includes(search.toLowerCase()));

    const matchGenre = selectedGenre === 'ALL' || book.genre === selectedGenre;
    const matchAvail =
      availabilityFilter === 'ALL' || (availabilityFilter === 'AVAILABLE' && book.availableCopies > 0);

    return matchSearch && matchGenre && matchAvail;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Library Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse, filter, and inspect volumes held across all library branches
          </p>
        </div>

        {role !== 'member' && (
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/books/new')}
          >
            Add New Volume
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              options={genres.map((g) => ({ value: g, label: g === 'ALL' ? 'All Genres' : g }))}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as 'ALL' | 'AVAILABLE')}
              options={[
                { value: 'ALL', label: 'All Availability' },
                { value: 'AVAILABLE', label: 'In Stock Only' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8 text-slate-500" />}
          title="No Books Matched Your Filters"
          description="Try broadening your search term or clearing the active genre filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedGenre('ALL');
                setAvailabilityFilter('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <div
                key={book.bookId}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={isAvailable ? 'success' : 'danger'} size="sm">
                      {isAvailable
                        ? `${book.availableCopies}/${book.totalCopies} Available`
                        : 'Depleted (0 on shelf)'}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500">{book.bookId}</span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {book.title}
                  </h3>

                  <p className="text-xs text-slate-300 font-medium mt-1">
                    by {book.author?.name || 'Unknown Author'}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{book.genre} • {book.language}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{book.library?.name || 'Central Branch'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Published {book.year} ({book.edition} Ed.)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 truncate max-w-[140px]">
                    ISBN: {book.isbn}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveBook(book)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Inspect
                    </Button>
                    {role !== 'member' && isAvailable && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/circulation?bookId=${book.bookId}`)}
                      >
                        Issue
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Details Modal */}
      {activeBook && (
        <Modal
          isOpen={!!activeBook}
          onClose={() => setActiveBook(null)}
          title={activeBook.title}
          subtitle={`Book ID: ${activeBook.bookId} • ISBN: ${activeBook.isbn}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono text-slate-400">
                Neo4j Node: (:Book {'{'} bookId: '{activeBook.bookId}' {'}'})
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveBook(null)}>
                  Close
                </Button>
                {role !== 'member' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const id = activeBook.bookId;
                      setActiveBook(null);
                      navigate(`/books/${id}/edit`);
                    }}
                  >
                    Edit Metadata
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Availability status */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeBook.availableCopies > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className="font-medium text-slate-200">
                  {activeBook.availableCopies > 0 ? 'Copies Available for Immediate Loan' : 'All Copies Borrowed'}
                </span>
              </div>
              <Badge variant={activeBook.availableCopies > 0 ? 'success' : 'danger'}>
                {activeBook.availableCopies} of {activeBook.totalCopies} Available
              </Badge>
            </div>

            {/* Relationship graph breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500">Author Relationship</span>
                <p className="text-sm font-semibold text-indigo-300 mt-0.5">
                  {activeBook.author?.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">ID: {activeBook.author?.authorId}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500">Publisher Relationship</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {activeBook.publisher?.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">ID: {activeBook.publisher?.publisherId}</p>
              </div>
            </div>

            {/* Metadata specs */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Genre</span>
                <span className="font-medium text-slate-200">{activeBook.genre}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Language</span>
                <span className="font-medium text-slate-200">{activeBook.language}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Edition / Year</span>
                <span className="font-medium text-slate-200">{activeBook.edition} ({activeBook.year})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Branch Location</span>
                <span className="font-medium text-slate-200">{activeBook.library?.name}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
