import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookPlus, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type { Author, Publisher, Library, CreateBookInput } from '../types';

export const AddEditBookPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId?: string }>();
  const isEditing = Boolean(bookId);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<CreateBookInput>({
    bookId: isEditing ? bookId || '' : 'B006',
    isbn: '',
    title: '',
    genre: 'Fiction',
    language: 'English',
    edition: '1st',
    year: 2026,
    totalCopies: 3,
    authorId: '',
    publisherId: '',
    libraryId: '',
  });

  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);

  // Fetch relations and existing book data if editing
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [authorsRes, pubRes, libRes] = await Promise.all([
          api.authors.list({ limit: 50 }).catch(() => null),
          api.publishers.list({ limit: 50 }).catch(() => null),
          api.libraries.list({ limit: 50 }).catch(() => null),
        ]);

        if (mounted) {
          if (authorsRes?.success && authorsRes.data?.items) {
            setAuthors(authorsRes.data.items);
          }
          if (pubRes?.success && pubRes.data?.items) {
            setPublishers(pubRes.data.items);
          }
          if (libRes?.success && libRes.data?.items) {
            setLibraries(libRes.data.items);
          }
        }

        if (isEditing && bookId) {
          const bookRes = await api.books.get(bookId).catch(() => null);
          if (mounted && bookRes?.success && bookRes.data) {
            const b = bookRes.data;
            setFormData({
              bookId: b.bookId,
              isbn: b.isbn,
              title: b.title,
              genre: b.genre,
              language: b.language,
              edition: b.edition || '1st',
              year: b.year,
              totalCopies: b.totalCopies,
              authorId: b.author?.authorId || 'A101',
              publisherId: b.publisher?.publisherId || 'PUB01',
              libraryId: b.library?.libraryId || 'LIB01',
            });
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [isEditing, bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.isbn || !formData.bookId) {
      setStatusMessage({ type: 'error', text: 'Please fill out all required fields (Book ID, Title, ISBN).' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (isEditing && bookId) {
        const res = await api.books.update(bookId, formData);
        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `Book "${formData.title}" (${formData.bookId}) successfully updated in database.`,
          });
          setTimeout(() => navigate('/books'), 1500);
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Server error updating book.',
          });
        }
      } else {
        const res = await api.books.create(formData);
        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `Book "${formData.title}" (${formData.bookId}) successfully created in database.`,
          });
          setTimeout(() => navigate('/books'), 1500);
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Server error creating book.',
          });
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error reaching API endpoint.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorOptions =
    authors.length > 0
      ? authors.map((a) => ({ value: a.authorId, label: `${a.name} (${a.authorId})` }))
      : [
          { value: 'A101', label: 'Ruskin Bond (A101)' },
          { value: 'A102', label: 'Chetan Bhagat (A102)' },
          { value: 'A103', label: 'Amish Tripathi (A103)' },
          { value: 'A104', label: 'Arundhati Roy (A104)' },
          { value: 'A105', label: 'R.K. Narayan (A105)' },
        ];

  const publisherOptions =
    publishers.length > 0
      ? publishers.map((p) => ({ value: p.publisherId, label: `${p.name} (${p.publisherId})` }))
      : [
          { value: 'PUB01', label: 'Penguin Books India (PUB01)' },
          { value: 'PUB02', label: 'Rupa Publications (PUB02)' },
          { value: 'PUB03', label: 'Westland Publications (PUB03)' },
          { value: 'PUB04', label: 'Indian Thought Publications (PUB04)' },
        ];

  const libraryOptions =
    libraries.length > 0
      ? libraries.map((l) => ({ value: l.libraryId, label: `${l.name} (${l.libraryId})` }))
      : [{ value: '', label: 'No libraries registered' }];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/books')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Catalog
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookPlus className="w-5 h-5 text-indigo-400" />
              {isEditing ? `Edit Volume: ${formData.bookId}` : 'Register New Volume'}
            </h1>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Update catalog attributes and physical inventory counts'
                : 'Create node and link relationships to Author, Publisher, and Library branch'}
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <Alert
          type={statusMessage.type}
          onClose={() => setStatusMessage(null)}
          title={statusMessage.type === 'success' ? 'Operation Confirmed' : 'Server Validation Error'}
        >
          {statusMessage.text}
        </Alert>
      )}

      {isLoading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading book record from backend...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card
            title="Catalog Metadata & Relational Links"
            subtitle="Persisted via session.withSession directly to Neo4j database"
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-500 font-mono">
                  Endpoint: {isEditing ? `PUT /api/books/${formData.bookId}` : 'POST /api/books'}
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" type="button" onClick={() => navigate('/books')}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    isLoading={isSubmitting}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {isEditing ? 'Save Changes' : 'Register Book'}
                  </Button>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Book ID"
                  value={formData.bookId}
                  disabled={isEditing}
                  required
                  onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                  helperText="Unique primary identifier (e.g. B001)"
                />
                <Input
                  label="ISBN-13"
                  value={formData.isbn}
                  required
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="978-0143335001"
                />
              </div>

              <Input
                label="Book Title"
                value={formData.title}
                required
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. The Room on the Roof"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Genre"
                  value={formData.genre}
                  required
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
                <Input
                  label="Language"
                  value={formData.language}
                  required
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                />
                <Input
                  label="Edition"
                  value={formData.edition || ''}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Publication Year"
                  type="number"
                  value={formData.year}
                  required
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })}
                />
                <Input
                  label="Total Copies"
                  type="number"
                  min={1}
                  value={formData.totalCopies}
                  required
                  onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                  helperText="Initial available copies equals total copies"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Graph Relationship Links
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Author (:WROTE)"
                    value={formData.authorId || ''}
                    onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                    options={authorOptions}
                  />
                  <Select
                    label="Publisher (:PUBLISHED)"
                    value={formData.publisherId || ''}
                    onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
                    options={publisherOptions}
                  />
                  <Select
                    label="Library Branch (:HELD_BY)"
                    value={formData.libraryId || ''}
                    onChange={(e) => setFormData({ ...formData, libraryId: e.target.value })}
                    options={libraryOptions}
                  />
                </div>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};
