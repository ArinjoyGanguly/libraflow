import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  GitFork,
  BookOpen,
  Users,
  Building2,
  RefreshCw,
  AlertCircle,
  Compass,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import type {
  Book,
  Member,
  RelatedBooksResult,
  MemberRecommendationsResult,
} from '../types';

export const DiscoveryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [focalBookId, setFocalBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [relatedData, setRelatedData] = useState<RelatedBooksResult | null>(null);
  const [recsData, setRecsData] = useState<MemberRecommendationsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recsError, setRecsError] = useState<string | null>(null);

  // 1. Fetch catalog books for anchor selection
  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const res = await api.books.list({ limit: 100 });
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setBooks(items);
        if (items.length > 0 && !focalBookId) {
          setFocalBookId(items[0].bookId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading books.');
    } finally {
      setLoadingBooks(false);
    }
  }, [focalBookId]);

  // 2. Fetch members for reading recommendation selection
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await api.members.list({ limit: 50 });
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setMembers(items);
        if (items.length > 0 && !selectedMemberId) {
          setSelectedMemberId(items[0].memberId);
        }
      }
    } catch {
      // Non-critical, ignore
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    fetchBooks();
    fetchMembers();
  }, [fetchBooks, fetchMembers]);

  // 3. Fetch Cypher-backed graph neighbors when focalBookId changes
  const fetchRelated = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingRelated(true);
    setError(null);
    try {
      const res = await api.books.related(id);
      if (res.success && res.data) {
        setRelatedData(res.data);
      } else {
        setError(res.error || `Unable to traverse relationships for book ${id}.`);
        setRelatedData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executing Cypher graph traversal.');
      setRelatedData(null);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  useEffect(() => {
    if (focalBookId) {
      fetchRelated(focalBookId);
    }
  }, [focalBookId, fetchRelated]);

  // 4. Fetch personalized recommendations for selected member
  const fetchRecommendations = useCallback(async (memberId: string) => {
    if (!memberId) return;
    setLoadingRecs(true);
    setRecsError(null);
    try {
      const res = await api.analytics.memberRecommendations(memberId);
      if (res.success && res.data) {
        setRecsData(res.data);
      } else {
        setRecsError(res.error || `Unable to calculate recommendations for member ${memberId}.`);
        setRecsData(null);
      }
    } catch (err) {
      setRecsError(err instanceof Error ? err.message : 'Error executing recommendation query.');
      setRecsData(null);
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      fetchRecommendations(selectedMemberId);
    }
  }, [selectedMemberId, fetchRecommendations]);

  const focalBook = relatedData?.focalBook || books.find((b) => b.bookId === focalBookId);
  const selectedMember = members.find((m) => m.memberId === selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
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
              LibraFlow navigates index-free adjacency relationships in real-time via Cypher patterns.
            </p>
          </div>

          <div className="w-full sm:w-64">
            {loadingBooks ? (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Loading catalog nodes...
              </div>
            ) : (
              <Select
                label="Select Anchor Node"
                value={focalBookId}
                onChange={(e) => setFocalBookId(e.target.value)}
                options={books.map((b) => ({
                  value: b.bookId,
                  label: `${b.title} (${b.bookId})`,
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <Alert type="error" title="Graph Traversal Notice" onClose={() => setError(null)}>
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchRelated(focalBookId)}
              className="ml-4"
            >
              Retry Traversal
            </Button>
          </div>
        </Alert>
      )}

      {/* Anchor Book Center Stage */}
      {focalBook ? (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600/20 text-indigo-300 font-mono text-[10px] uppercase tracking-wider rounded-bl-xl border-l border-b border-indigo-500/30">
            Anchor Node (:Book)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="text-xs font-mono text-indigo-400 font-semibold">{focalBook.bookId}</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{focalBook.title}</h2>
              <p className="text-xs text-slate-300 mt-1">
                Authored by <strong className="text-indigo-300">{focalBook.author?.name || 'Unknown Author'}</strong> • Published by {focalBook.publisher?.name || 'Unknown Publisher'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{focalBook.genre || 'General'}</Badge>
                <Badge variant="info">{focalBook.language || 'English'}</Badge>
                <Badge variant="success">{focalBook.availableCopies} Copies Available</Badge>
              </div>
            </div>

            {/* Direct 1st Degree Graph Neighbors */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  <GitFork className="w-3 h-3 text-indigo-400" />
                  -[:WROTE]-
                </span>
                <p className="text-xs font-semibold text-white mt-1">
                  {focalBook.author?.name || 'Author Node'}
                </p>
                <span className="text-[10px] font-mono text-slate-400">
                  Node ID: {focalBook.author?.authorId || 'A00'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                  <GitFork className="w-3 h-3 text-sky-400" />
                  -[:PUBLISHED]-
                </span>
                <p className="text-xs font-semibold text-white mt-1">
                  {focalBook.publisher?.name || 'Publisher Node'}
                </p>
                <span className="text-[10px] font-mono text-slate-400">
                  Node ID: {focalBook.publisher?.publisherId || 'P00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          No anchor book node selected.
        </div>
      )}

      {/* Traversal Results Section */}
      {loadingRelated ? (
        <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <p className="text-sm">Executing Cypher graph traversals across database nodes...</p>
        </div>
      ) : relatedData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Same Author Circle */}
          <Card
            title="Author Bibliography Circle"
            subtitle="(:Author)-[:WROTE]->(:Book)"
            headerAction={<Badge variant="purple" size="sm">{relatedData.sameAuthor?.length || 0} Nodes</Badge>}
          >
            {(!relatedData.sameAuthor || relatedData.sameAuthor.length === 0) ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <BookOpen className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                No other titles by this author currently in catalog.
              </div>
            ) : (
              <div className="space-y-3">
                {relatedData.sameAuthor.map((book) => (
                  <div
                    key={book.bookId}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{book.title}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{book.bookId}</span>
                      </div>
                      <Badge variant="outline" size="sm">{book.genre}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 2. Same Publisher Imprint */}
          <Card
            title="Publisher Catalog Imprint"
            subtitle="(:Publisher)-[:PUBLISHED]->(:Book)"
            headerAction={<Badge variant="info" size="sm">{relatedData.samePublisher?.length || 0} Nodes</Badge>}
          >
            {(!relatedData.samePublisher || relatedData.samePublisher.length === 0) ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Building2 className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                No other titles registered under this publishing imprint.
              </div>
            ) : (
              <div className="space-y-3">
                {relatedData.samePublisher.map((book) => (
                  <div
                    key={book.bookId}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{book.title}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{book.bookId}</span>
                      </div>
                      <Badge variant="outline" size="sm">{book.genre}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 3. Collaborative Borrowing Recommendations */}
          <Card
            title="Collaborative Co-Borrowing"
            subtitle="(:Book)<-[:FOR_BOOK]-(:Loan)<-[:BORROWED]-(:Member)"
            headerAction={<Badge variant="success" size="sm">{relatedData.coBorrowed?.length || 0} Nodes</Badge>}
          >
            {(!relatedData.coBorrowed || relatedData.coBorrowed.length === 0) ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Users className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                No 2-hop co-borrowing overlap found for this title yet.
              </div>
            ) : (
              <div className="space-y-3">
                {relatedData.coBorrowed.map((book) => (
                  <div
                    key={book.bookId}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{book.title}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{book.bookId}</span>
                      </div>
                      <Badge variant="success" size="sm">{book.availableCopies} Avail</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">Select an anchor volume above to visualize live graph relationships.</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* Personalized Member Reading Recommendations Section */}
      {/* ======================================================== */}
      <Card
        title="Personalized Member Reading Recommendations (3-Hop Graph Traversal)"
        subtitle="Graph collaborative filtering: recommends books borrowed by readers with similar borrowing history"
        headerAction={
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Member:</span>
            <div className="w-48 sm:w-56">
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                options={members.map((m) => ({
                  value: m.memberId,
                  label: `${m.name} (${m.memberId})`,
                }))}
                disabled={loadingMembers}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loadingRecs ? 'animate-spin' : ''}`} />}
              onClick={() => fetchRecommendations(selectedMemberId)}
              disabled={loadingRecs || !selectedMemberId}
            >
              Refresh
            </Button>
          </div>
        }
      >
        {recsError && (
          <Alert type="warning" title="Recommendation Info" onClose={() => setRecsError(null)}>
            {recsError}
          </Alert>
        )}

        {loadingRecs ? (
          <div className="p-10 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            <p className="text-xs">Computing personalized co-reading graph paths for member...</p>
          </div>
        ) : recsData && recsData.recommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Recommendations for <strong className="text-white">{recsData.memberName}</strong> ({recsData.memberId})
                </span>
              </div>
              <Badge variant="purple" size="sm">
                {recsData.recommendations.length} Explainable Matches
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recsData.recommendations.map((rec) => (
                <div
                  key={rec.bookId}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono text-indigo-400">{rec.bookId}</span>
                      <Badge variant="outline" size="sm">
                        {rec.genre}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-tight mb-1 line-clamp-2">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">{rec.author}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{rec.availableCopies} available now</span>
                    </div>

                    <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-[10px] text-indigo-300">
                      <strong>Explainable Match:</strong> {rec.coReaderCount} reader
                      {rec.coReaderCount > 1 ? 's' : ''} with overlapping borrowing taste also read this.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-950/30 border border-slate-800/60">
            <Compass className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">
              No personalized graph recommendations available yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {selectedMember
                ? `Member ${selectedMember.name} has either read all available co-read titles or needs more loan history to compute collaborative overlaps.`
                : 'Select a registered member to discover tailor-made titles based on community reading networks.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
