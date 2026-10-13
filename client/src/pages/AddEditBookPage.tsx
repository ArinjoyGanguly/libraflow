import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookPlus, ArrowLeft, Save } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { SEED_BOOKS, SEED_LIBRARIES } from '../services/seedData';

export const AddEditBookPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId?: string }>();
  const isEditing = Boolean(bookId);

  const [formData, setFormData] = useState(() => {
    if (isEditing && bookId) {
      const existing = SEED_BOOKS.find((b) => b.bookId === bookId);
      if (existing) {
        return {
          bookId: existing.bookId,
          isbn: existing.isbn,
          title: existing.title,
          genre: existing.genre,
          language: existing.language,
          edition: existing.edition || '1st',
          year: existing.year,
          totalCopies: existing.totalCopies,
          authorId: existing.author?.authorId || 'A101',
          publisherId: existing.publisher?.publisherId || 'PUB01',
          libraryId: existing.library?.libraryId || 'LIB01',
        };
      }
    }
    return {
      bookId: `B00${SEED_BOOKS.length + 1}`,
      isbn: '',
      title: '',
      genre: 'Fiction',
      language: 'English',
      edition: '1st',
      year: 2026,
      totalCopies: 3,
      authorId: 'A101',
      publisherId: 'PUB01',
      libraryId: 'LIB01',
    };
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.isbn) {
      setStatusMessage({ type: 'error', text: 'Please fill out all required fields (Title and ISBN).' });
      return;
    }

    setStatusMessage({
      type: 'success',
      text: `Book record for "${formData.title}" (${formData.bookId}) verified and validated. In Phase 7 this mutation persists to Neo4j.`,
    });
  };

  const authors = [
    { value: 'A101', label: 'Ruskin Bond (A101)' },
    { value: 'A102', label: 'Chetan Bhagat (A102)' },
    { value: 'A103', label: 'Amish Tripathi (A103)' },
    { value: 'A104', label: 'Arundhati Roy (A104)' },
    { value: 'A105', label: 'R.K. Narayan (A105)' },
  ];

  const publishers = [
    { value: 'PUB01', label: 'Penguin Books India (PUB01)' },
    { value: 'PUB02', label: 'Rupa Publications (PUB02)' },
    { value: 'PUB03', label: 'Westland Publications (PUB03)' },
    { value: 'PUB04', label: 'Indian Thought Publications (PUB04)' },
  ];

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
                ? 'Update catalogue metadata and physical inventory counts'
                : 'Create node and link relationships to Author, Publisher, and Library branch'}
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <Alert
          type={statusMessage.type}
          onClose={() => setStatusMessage(null)}
          title={statusMessage.type === 'success' ? 'Validation Successful' : 'Validation Error'}
        >
          {statusMessage.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card
          title="Catalog Metadata & Relational Links"
          subtitle="All inputs map to Neo4j Node properties and Cypher relationships"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                API Endpoint: {isEditing ? `PUT /api/books/${formData.bookId}` : 'POST /api/books'}
              </span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" type="button" onClick={() => navigate('/books')}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" leftIcon={<Save className="w-4 h-4" />}>
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
                value={formData.edition}
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
                  label="Author (:WRITTEN_BY)"
                  value={formData.authorId}
                  onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                  options={authors}
                />
                <Select
                  label="Publisher (:PUBLISHED_BY)"
                  value={formData.publisherId}
                  onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
                  options={publishers}
                />
                <Select
                  label="Library Branch (:LOCATED_AT)"
                  value={formData.libraryId}
                  onChange={(e) => setFormData({ ...formData, libraryId: e.target.value })}
                  options={SEED_LIBRARIES.map((l) => ({ value: l.libraryId, label: `${l.name} (${l.libraryId})` }))}
                />
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
