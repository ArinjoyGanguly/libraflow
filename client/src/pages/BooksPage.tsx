import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Book } from '../types';

export const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE'>('ALL');
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  // Deletion Confirmation Dialog State
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const genres = ['ALL', 'Fiction', 'Mythology', 'Literary Fiction', 'Short Stories', 'Classic', 'Science'];

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const queryParams: Record<string, unknown> = {
      page,
      limit: 12,
    };
    if (search.trim()) queryParams.search = search.trim();
    if (selectedGenre !== 'ALL') queryParams.genre = selectedGenre;

    try {
      const res = await api.books.list(queryParams);
      if (res.success && res.data) {
        let items = res.data.items || [];
        if (availabilityFilter === 'AVAILABLE') {
          items = items.filter((b) => b.availableCopies > 0);
        }
        setBooks(items);
        setTotalBooks(res.data.total || items.length);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError(res.error || 'Failed to retrieve books from server.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error communicating with backend.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedGenre, availabilityFilter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.books.delete(bookToDelete.bookId);
      if (res.success) {
        setActionSuccess(`Book "${bookToDelete.title}" (${bookToDelete.bookId}) successfully deleted.`);
        setBookToDelete(null);
        fetchBooks();
      } else {
        setActionError(res.error || 'Failed to delete book.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network failure during delete.');
    } finally {
      setIsDeleting(false);
    }
  };

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
            Real-time catalog inventory powered by backend Neo4j service
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchBooks()}
          >
            Refresh
          </Button>

          {role !== 'member' && (
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/books/new')}
            >
              Add New Volume
            </Button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <Alert type="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert type="error" title="Delete Operation Blocked" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {error && (
        <Alert type="warning" title="Backend Connection Notice" onClose={() => setError(null)}>
          <div className="space-y-2">
            <p>{error}</p>
            <div className="pt-1">
              <Button size="sm" variant="secondary" onClick={() => fetchBooks()}>
                Retry API Request
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setPage(1);
              }}
              options={genres.map((g) => ({ value: g, label: g === 'ALL' ? 'All Genres' : g }))}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value as 'ALL' | 'AVAILABLE');
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Availability' },
                { value: 'AVAILABLE', label: 'In Stock Only' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Books Grid */}
      {isLoading && books.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8 text-slate-500" />}
          title="No Books Found"
          description="No volumes match your active search terms or filter selection in the database."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedGenre('ALL');
                setAvailabilityFilter('ALL');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book) => {
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
                        <span>Published {book.year} ({book.edition || '1st'} Ed.)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[130px]">
                      ISBN: {book.isbn}
                    </span>

                    <div className="flex items-center gap-1.5">
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
                      {role === 'admin' && (
                        <button
                          onClick={() => setBookToDelete(book)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                          title="Delete book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Showing {books.length} of {totalBooks} books (Page {page} of {totalPages})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const bId = activeBook.bookId;
                  setActiveBook(null);
                  navigate(`/discovery?bookId=${bId}`);
                }}
              >
                Graph Discovery
              </Button>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500">Author Relationship</span>
                <p className="text-sm font-semibold text-indigo-300 mt-0.5">
                  {activeBook.author?.name || 'Unlinked'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">ID: {activeBook.author?.authorId || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500">Publisher Relationship</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {activeBook.publisher?.name || 'Unlinked'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">ID: {activeBook.publisher?.publisherId || 'N/A'}</p>
              </div>
            </div>

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
                <span className="font-medium text-slate-200">{activeBook.edition || '1st'} ({activeBook.year})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Branch Location</span>
                <span className="font-medium text-slate-200">{activeBook.library?.name || 'Main Branch'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <Modal
          isOpen={!!bookToDelete}
          onClose={() => setBookToDelete(null)}
          title="Confirm Volume Deletion"
          subtitle={`Book ID: ${bookToDelete.bookId}`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setBookToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteBook}
              >
                Delete Volume
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold text-rose-200">Irreversible Catalog Action</p>
                <p className="mt-1">
                  Are you sure you want to delete <strong>"{bookToDelete.title}"</strong> ({bookToDelete.bookId})?
                  The server referential integrity guard will reject deletion if active loans exist.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
