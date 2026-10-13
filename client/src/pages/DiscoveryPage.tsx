import React, { useState } from 'react';
import {
  Sparkles,
  GitFork,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Select } from '../components/common/Select';
import { SEED_BOOKS, SEED_LOANS } from '../services/seedData';

export const DiscoveryPage: React.FC = () => {
  const [focalBookId, setFocalBookId] = useState(SEED_BOOKS[0]?.bookId || 'B001');

  const focalBook = SEED_BOOKS.find((b) => b.bookId === focalBookId) || SEED_BOOKS[0];

  // Graph traversals:
  // 1. Same Author:
  const sameAuthorBooks = SEED_BOOKS.filter(
    (b) => b.bookId !== focalBook.bookId && b.author?.authorId === focalBook.author?.authorId
  );

  // 2. Same Publisher:
  const samePublisherBooks = SEED_BOOKS.filter(
    (b) => b.bookId !== focalBook.bookId && b.publisher?.publisherId === focalBook.publisher?.publisherId
  );

  // 3. Same Genre:
  const sameGenreBooks = SEED_BOOKS.filter(
    (b) => b.bookId !== focalBook.bookId && b.genre === focalBook.genre
  );

  // 4. Co-borrowed via Member borrowing patterns:
  const borrowers = SEED_LOANS.filter((l) => l.book?.bookId === focalBook.bookId).map(
    (l) => l.member?.memberId
  );
  const coBorrowedBookIds = Array.from(
    new Set(
      SEED_LOANS.filter(
        (l) =>
          borrowers.includes(l.member?.memberId) &&
          l.book?.bookId !== focalBook.bookId
      ).map((l) => l.book?.bookId)
    )
  );
  const coBorrowedBooks = SEED_BOOKS.filter((b) => coBorrowedBookIds.includes(b.bookId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-violet-950/50 border border-indigo-900/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Neo4j Graph-Powered Discovery
              </h1>
              <Badge variant="purple">Native Graph Traversal</Badge>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Unlike traditional relational SQL JOINs that slow down with multi-hop traversals,
              LibraFlow navigates index-free adjacency relationships in real-time.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Select
              label="Select Anchor Node"
              value={focalBookId}
              onChange={(e) => setFocalBookId(e.target.value)}
              options={SEED_BOOKS.map((b) => ({
                value: b.bookId,
                label: `${b.title} (${b.bookId})`,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Anchor Book Center Stage */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600/20 text-indigo-300 font-mono text-[10px] uppercase tracking-wider rounded-bl-xl border-l border-b border-indigo-500/30">
          Anchor Node (:Book)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2">
            <span className="text-xs font-mono text-indigo-400 font-semibold">{focalBook.bookId}</span>
            <h2 className="text-xl font-bold text-white mt-0.5">{focalBook.title}</h2>
            <p className="text-xs text-slate-300 mt-1">
              Authored by <strong className="text-indigo-300">{focalBook.author?.name}</strong> • Published by {focalBook.publisher?.name}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline">{focalBook.genre}</Badge>
              <Badge variant="info">{focalBook.language}</Badge>
              <Badge variant="success">{focalBook.availableCopies} Copies Available</Badge>
            </div>
          </div>

          {/* 1st Degree Direct Graph Neighbors */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <GitFork className="w-3 h-3 text-indigo-400" />
                -[:WRITTEN_BY]-&gt;
              </span>
              <p className="text-xs font-semibold text-white mt-1">{focalBook.author?.name}</p>
              <span className="text-[10px] font-mono text-slate-400">Node ID: {focalBook.author?.authorId}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <GitFork className="w-3 h-3 text-sky-400" />
                -[:PUBLISHED_BY]-&gt;
              </span>
              <p className="text-xs font-semibold text-white mt-1">{focalBook.publisher?.name}</p>
              <span className="text-[10px] font-mono text-slate-400">Node ID: {focalBook.publisher?.publisherId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traversal Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Author Bibliography */}
        <Card
          title="Same Author Circle"
          subtitle={`By ${focalBook.author?.name}`}
        >
          {sameAuthorBooks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Single title by this author currently in catalog.
            </p>
          ) : (
            <div className="space-y-3">
              {sameAuthorBooks.map((book) => (
                <div
                  key={book.bookId}
                  onClick={() => setFocalBookId(book.bookId)}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-indigo-400">{book.bookId}</span>
                    <Badge variant="purple" size="sm">Author</Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{book.genre}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Co-Borrowing Network */}
        <Card
          title="Students Also Borrowed"
          subtitle="Co-borrowed by same members"
        >
          {coBorrowedBooks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No overlapping borrow paths in seed records.
            </p>
          ) : (
            <div className="space-y-3">
              {coBorrowedBooks.map((book) => (
                <div
                  key={book.bookId}
                  onClick={() => setFocalBookId(book.bookId)}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-indigo-400">{book.bookId}</span>
                    <Badge variant="purple" size="sm">Co-Borrowed</Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">by {book.author?.name}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Same Publisher Network */}
        <Card
          title="Publisher Imprint"
          subtitle={focalBook.publisher?.name}
        >
          {samePublisherBooks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No other titles from this publisher in catalog.
            </p>
          ) : (
            <div className="space-y-3">
              {samePublisherBooks.map((book) => (
                <div
                  key={book.bookId}
                  onClick={() => setFocalBookId(book.bookId)}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-sky-400">{book.bookId}</span>
                    <Badge variant="info" size="sm">Publisher</Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">by {book.author?.name}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Same Genre Cluster */}
        <Card
          title={`Genre: ${focalBook.genre}`}
          subtitle="Matching literary genre"
        >
          {sameGenreBooks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Solo title in this genre category.
            </p>
          ) : (
            <div className="space-y-3">
              {sameGenreBooks.map((book) => (
                <div
                  key={book.bookId}
                  onClick={() => setFocalBookId(book.bookId)}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-emerald-400">{book.bookId}</span>
                    <Badge variant="success" size="sm">{book.genre}</Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">by {book.author?.name}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
