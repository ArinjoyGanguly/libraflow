import { withSession } from '../config/neo4j';
import { toNative } from '../utils/neo4j-helpers';
import {
  AnalyticsResult,
  MemberRecommendationsResult,
} from '../types';
import { NotFoundError } from '../utils/errors';

export class AnalyticsService {
  /**
   * Aggregated library analytics dashboard.
   * Executes 5 independent Cypher queries and merges results.
   *
   * Q13: Popular books ranked by total borrows
   * Q15: Genre popularity by borrow count
   * Q14: Top members by borrow count and fines
   * Q18: Library stock report with staff counts
   * OVERDUE: Live overdue snapshot with average days overdue
   */
  static async getAnalytics(): Promise<AnalyticsResult> {
    return withSession(async (session) => {
      // Q13 — Books ranked by borrow frequency (top 10)
      const popularBooksRes = await session.run(`
        MATCH (l:Loan)-[:FOR_BOOK]->(b:Book)
        WITH b, count(l) AS totalBorrows
        OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
        RETURN b.bookId          AS bookId,
               b.title           AS title,
               coalesce(a.name, 'Unknown') AS author,
               b.genre           AS genre,
               totalBorrows,
               b.availableCopies AS currentlyAvailable
        ORDER BY totalBorrows DESC
        LIMIT 10
      `);

      const popularBooks = popularBooksRes.records.map((rec) => ({
        bookId: String(toNative(rec.get('bookId')) ?? ''),
        title: String(toNative(rec.get('title')) ?? ''),
        author: String(toNative(rec.get('author')) ?? 'Unknown'),
        genre: String(toNative(rec.get('genre')) ?? 'General'),
        totalBorrows: Number(toNative(rec.get('totalBorrows'))) || 0,
        currentlyAvailable: Number(toNative(rec.get('currentlyAvailable'))) || 0,
      }));

      // Q15 (corrected) — Genre popularity by borrow count with unique title count
      const genreRes = await session.run(`
        MATCH (l:Loan)-[:FOR_BOOK]->(b:Book)
        WITH b.genre AS genre, count(l) AS borrowCount, count(DISTINCT b) AS uniqueTitles
        RETURN genre, borrowCount, uniqueTitles
        ORDER BY borrowCount DESC
        LIMIT 10
      `);

      const genreStats = genreRes.records.map((rec) => ({
        genre: String(toNative(rec.get('genre')) ?? 'General'),
        borrowCount: Number(toNative(rec.get('borrowCount'))) || 0,
        uniqueTitles: Number(toNative(rec.get('uniqueTitles'))) || 0,
      }));

      // Q14 — Members ranked by borrow count and total fines paid
      const topBorrowersRes = await session.run(`
        MATCH (m:Member)
        OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan)
        WITH m,
             count(l)          AS totalBorrows,
             sum(l.fineAmount) AS totalFinesPaid
        WHERE totalBorrows > 0
        RETURN m.memberId   AS memberId,
               m.name       AS name,
               totalBorrows,
               coalesce(totalFinesPaid, 0) AS totalFinesPaid
        ORDER BY totalBorrows DESC
        LIMIT 8
      `);

      const topBorrowers = topBorrowersRes.records.map((rec) => ({
        memberId: String(toNative(rec.get('memberId')) ?? ''),
        name: String(toNative(rec.get('name')) ?? ''),
        totalBorrows: Number(toNative(rec.get('totalBorrows'))) || 0,
        totalFinesPaid: Number(toNative(rec.get('totalFinesPaid'))) || 0,
      }));

      // Q18 — Library stock report
      const libraryStockRes = await session.run(`
        MATCH (lib:Library)
        OPTIONAL MATCH (b:Book)-[:HELD_BY]->(lib)
        WITH lib,
             count(b)              AS bookCount,
             sum(b.totalCopies)    AS totalStock,
             sum(b.availableCopies) AS totalAvailable
        OPTIONAL MATCH (e:Employee)-[:WORKS_AT]->(lib)
        RETURN lib.libraryId  AS libraryId,
               lib.name       AS libraryName,
               lib.city       AS city,
               bookCount,
               coalesce(totalStock, 0)     AS totalStock,
               coalesce(totalAvailable, 0) AS totalAvailable,
               count(e)       AS staffCount
        ORDER BY bookCount DESC
      `);

      const libraryStock = libraryStockRes.records.map((rec) => ({
        libraryId: String(toNative(rec.get('libraryId')) ?? ''),
        libraryName: String(toNative(rec.get('libraryName')) ?? ''),
        city: String(toNative(rec.get('city')) ?? ''),
        bookCount: Number(toNative(rec.get('bookCount'))) || 0,
        totalStock: Number(toNative(rec.get('totalStock'))) || 0,
        totalAvailable: Number(toNative(rec.get('totalAvailable'))) || 0,
        staffCount: Number(toNative(rec.get('staffCount'))) || 0,
      }));

      // Overdue snapshot — total overdue loans, total active fines, avg days overdue
      const overdueRes = await session.run(`
        MATCH (l:Loan)
        WHERE l.status IN ['ACTIVE', 'OVERDUE'] AND l.dueDate < date()
        RETURN count(l)                                                      AS totalOverdue,
               sum(l.fineAmount)                                             AS totalActiveFines,
               avg(duration.between(l.dueDate, date()).days)                 AS avgDaysOverdue
      `);

      const overdueRec = overdueRes.records[0];
      const overdueSnapshot = overdueRec
        ? {
            totalOverdue: Number(toNative(overdueRec.get('totalOverdue'))) || 0,
            totalActiveFines: Number(toNative(overdueRec.get('totalActiveFines'))) || 0,
            avgDaysOverdue: Math.round(
              Number(toNative(overdueRec.get('avgDaysOverdue'))) || 0
            ),
          }
        : { totalOverdue: 0, totalActiveFines: 0, avgDaysOverdue: 0 };

      return { popularBooks, genreStats, topBorrowers, libraryStock, overdueSnapshot };
    }, { accessMode: 'READ' });
  }

  /**
   * Personalized reading recommendations for a specific member.
   *
   * Algorithm:
   *   (targetMember)-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(readBook)
   *   <-[:FOR_BOOK]-(:Loan)<-[:BORROWED]-(coReader:Member)
   *   (coReader)-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(recommendation)
   *   WHERE recommendation NOT already borrowed by targetMember
   *
   * Ranks results by co-reader count (how many members who read the same books
   * also read the recommendation).
   */
  static async getMemberRecommendations(memberId: string): Promise<MemberRecommendationsResult> {
    return withSession(async (session) => {
      // Verify member exists
      const memberRes = await session.run(
        'MATCH (m:Member {memberId: $memberId}) RETURN m.name AS name',
        { memberId }
      );
      if (memberRes.records.length === 0) {
        throw new NotFoundError(`Member with ID '${memberId}' not found`);
      }
      const memberName = String(toNative(memberRes.records[0].get('name')) ?? memberId);

      // Graph traversal: 3-hop co-reading recommendation
      const recsRes = await session.run(`
        MATCH (m:Member {memberId: $memberId})-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(alreadyRead:Book)
        WITH m, collect(DISTINCT alreadyRead.bookId) AS readBookIds

        MATCH (m)-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(sharedBook:Book)
             <-[:FOR_BOOK]-(:Loan)<-[:BORROWED]-(coReader:Member)
        WHERE coReader.memberId <> $memberId

        MATCH (coReader)-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(rec:Book)
        WHERE NOT rec.bookId IN readBookIds
          AND rec.availableCopies > 0

        OPTIONAL MATCH (a:Author)-[:WROTE]->(rec)

        RETURN rec.bookId              AS bookId,
               rec.title               AS title,
               rec.genre               AS genre,
               coalesce(a.name, 'Unknown') AS author,
               rec.availableCopies     AS availableCopies,
               count(DISTINCT coReader) AS coReaderCount
        ORDER BY coReaderCount DESC, rec.title ASC
        LIMIT 8
      `, { memberId });

      const recommendations = recsRes.records.map((rec) => ({
        bookId: String(toNative(rec.get('bookId')) ?? ''),
        title: String(toNative(rec.get('title')) ?? ''),
        genre: String(toNative(rec.get('genre')) ?? 'General'),
        author: String(toNative(rec.get('author')) ?? 'Unknown'),
        availableCopies: Number(toNative(rec.get('availableCopies'))) || 0,
        coReaderCount: Number(toNative(rec.get('coReaderCount'))) || 0,
      }));

      return { memberId, memberName, recommendations };
    }, { accessMode: 'READ' });
  }
}
