import neo4j from 'neo4j-driver';
import { withSession } from '../config/neo4j';
import { BookDTO, CreateBookInput, UpdateBookInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { toNative } from '../utils/neo4j-helpers';

export class BooksService {
  /**
   * List books with search, genre filter, pagination and sorting.
   */
  static async listBooks(query: PaginationQuery): Promise<PaginatedResult<BookDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';
      const genre = query.genre?.trim() || '';

      const whereClauses: string[] = [];
      if (search) {
        whereClauses.push(
          '(toLower(b.title) CONTAINS toLower($search) OR toLower(b.isbn) CONTAINS toLower($search) OR toLower(coalesce(a.name, "")) CONTAINS toLower($search))'
        );
      }
      if (genre) {
        whereClauses.push('toLower(b.genre) = toLower($genre)');
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Safe sorting whitelist
      const validSortFields: Record<string, string> = {
        title: 'b.title',
        year: 'b.year',
        availableCopies: 'b.availableCopies',
        totalCopies: 'b.totalCopies',
      };
      const sortField = validSortFields[query.sortBy || 'title'] || 'b.title';
      const sortOrder = query.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

      const countCypher = `
        MATCH (b:Book)
        OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
        ${whereStr}
        RETURN count(b) AS total
      `;

      const listCypher = `
        MATCH (b:Book)
        OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
        OPTIONAL MATCH (p:Publisher)-[:PUBLISHED]->(b)
        OPTIONAL MATCH (b)-[:HELD_BY]->(lib:Library)
        ${whereStr}
        RETURN b,
               { authorId: a.authorId, name: a.name } AS author,
               { publisherId: p.publisherId, name: p.name } AS publisher,
               { libraryId: lib.libraryId, name: lib.name } AS library
        ORDER BY ${sortField} ${sortOrder}
        SKIP $skip
        LIMIT $limit
      `;

      const countRes = await session.run(countCypher, { search, genre });
      const total = toNative(countRes.records[0]?.get('total')) || 0;

      const listRes = await session.run(listCypher, {
        search,
        genre,
        skip: neo4j.int(skip),
        limit: neo4j.int(limit),
      });

      const items: BookDTO[] = listRes.records.map((rec) => {
        const bookNode = toNative(rec.get('b'));
        const author = toNative(rec.get('author'));
        const publisher = toNative(rec.get('publisher'));
        const library = toNative(rec.get('library'));

        return {
          ...bookNode,
          author: author?.authorId ? author : undefined,
          publisher: publisher?.publisherId ? publisher : undefined,
          library: library?.libraryId ? library : undefined,
        };
      });

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }, { accessMode: 'READ' });
  }

  /**
   * Detail of a single book with author, publisher, and library branch.
   */
  static async getBookById(bookId: string): Promise<BookDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (b:Book {bookId: $bookId})
        OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
        OPTIONAL MATCH (p:Publisher)-[:PUBLISHED]->(b)
        OPTIONAL MATCH (b)-[:HELD_BY]->(lib:Library)
        RETURN b,
               { authorId: a.authorId, name: a.name } AS author,
               { publisherId: p.publisherId, name: p.name } AS publisher,
               { libraryId: lib.libraryId, name: lib.name } AS library
      `;

      const res = await session.run(cypher, { bookId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Book with ID '${bookId}' not found`);
      }

      const bookNode = toNative(res.records[0].get('b'));
      const author = toNative(res.records[0].get('author'));
      const publisher = toNative(res.records[0].get('publisher'));
      const library = toNative(res.records[0].get('library'));

      return {
        ...bookNode,
        author: author?.authorId ? author : undefined,
        publisher: publisher?.publisherId ? publisher : undefined,
        library: library?.libraryId ? library : undefined,
      };
    }, { accessMode: 'READ' });
  }

  /**
   * Create a new book.
   */
  static async createBook(input: CreateBookInput): Promise<BookDTO> {
    return withSession(async (session) => {
      // Check ID existence
      const idRes = await session.run(
        'MATCH (b:Book {bookId: $bookId}) RETURN b.bookId AS id',
        { bookId: input.bookId }
      );
      if (idRes.records.length > 0) {
        throw new ConflictError(`Book with ID '${input.bookId}' already exists`);
      }

      // Check ISBN existence
      const isbnRes = await session.run(
        'MATCH (b:Book {isbn: $isbn}) RETURN b.isbn AS isbn',
        { isbn: input.isbn }
      );
      if (isbnRes.records.length > 0) {
        throw new ConflictError(`Book with ISBN '${input.isbn}' already exists`);
      }

      const totalCopies = Math.max(0, Number(input.totalCopies) || 1);
      const year = Number(input.year) || new Date().getFullYear();

      // Create Book node
      const createCypher = `
        CREATE (b:Book {
          bookId: $bookId,
          isbn: $isbn,
          title: $title,
          genre: $genre,
          language: $language,
          edition: $edition,
          year: $year,
          totalCopies: $totalCopies,
          availableCopies: $availableCopies
        })
        RETURN b
      `;

      await session.run(createCypher, {
        bookId: input.bookId,
        isbn: input.isbn,
        title: input.title,
        genre: input.genre,
        language: input.language,
        edition: input.edition || null,
        year: neo4j.int(year),
        totalCopies: neo4j.int(totalCopies),
        availableCopies: neo4j.int(totalCopies), // Initially all copies are available
      });

      // Link Author if provided
      if (input.authorId) {
        const linkAuthor = `
          MATCH (a:Author {authorId: $authorId}), (b:Book {bookId: $bookId})
          MERGE (a)-[:WROTE]->(b)
        `;
        await session.run(linkAuthor, { authorId: input.authorId, bookId: input.bookId });
      }

      // Link Publisher if provided
      if (input.publisherId) {
        const linkPublisher = `
          MATCH (p:Publisher {publisherId: $publisherId}), (b:Book {bookId: $bookId})
          MERGE (p)-[:PUBLISHED]->(b)
        `;
        await session.run(linkPublisher, { publisherId: input.publisherId, bookId: input.bookId });
      }

      // Link Library if provided
      if (input.libraryId) {
        const linkLibrary = `
          MATCH (lib:Library {libraryId: $libraryId}), (b:Book {bookId: $bookId})
          MERGE (b)-[:HELD_BY]->(lib)
        `;
        await session.run(linkLibrary, { libraryId: input.libraryId, bookId: input.bookId });
      }

      return BooksService.getBookById(input.bookId);
    }, { accessMode: 'WRITE' });
  }

  /**
   * Update an existing book.
   */
  static async updateBook(bookId: string, input: UpdateBookInput): Promise<BookDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (b:Book {bookId: $bookId}) RETURN b',
        { bookId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Book with ID '${bookId}' not found`);
      }

      // Check unique ISBN if updating
      if (input.isbn) {
        const isbnRes = await session.run(
          'MATCH (b:Book {isbn: $isbn}) WHERE b.bookId <> $bookId RETURN b.isbn AS isbn',
          { isbn: input.isbn, bookId }
        );
        if (isbnRes.records.length > 0) {
          throw new ConflictError(`Book with ISBN '${input.isbn}' already exists`);
        }
      }

      const currentBook = toNative(checkRes.records[0].get('b'));

      // If updating totalCopies, ensure it doesn't violate active loans
      let newTotalCopies = input.totalCopies !== undefined ? Number(input.totalCopies) : undefined;
      let newAvailableCopies: number | undefined = undefined;

      if (newTotalCopies !== undefined) {
        const activeLoans = currentBook.totalCopies - currentBook.availableCopies;
        if (newTotalCopies < activeLoans) {
          throw new BadRequestError(
            `Cannot reduce totalCopies to ${newTotalCopies}. There are currently ${activeLoans} active loans for this book.`
          );
        }
        newAvailableCopies = currentBook.availableCopies + (newTotalCopies - currentBook.totalCopies);
      }

      const updateCypher = `
        MATCH (b:Book {bookId: $bookId})
        SET b.isbn = coalesce($isbn, b.isbn),
            b.title = coalesce($title, b.title),
            b.genre = coalesce($genre, b.genre),
            b.language = coalesce($language, b.language),
            b.edition = coalesce($edition, b.edition),
            b.year = coalesce($year, b.year),
            b.totalCopies = coalesce($totalCopies, b.totalCopies),
            b.availableCopies = coalesce($availableCopies, b.availableCopies)
        RETURN b
      `;

      await session.run(updateCypher, {
        bookId,
        isbn: input.isbn !== undefined ? input.isbn : null,
        title: input.title !== undefined ? input.title : null,
        genre: input.genre !== undefined ? input.genre : null,
        language: input.language !== undefined ? input.language : null,
        edition: input.edition !== undefined ? input.edition : null,
        year: input.year !== undefined ? neo4j.int(input.year) : null,
        totalCopies: newTotalCopies !== undefined ? neo4j.int(newTotalCopies) : null,
        availableCopies: newAvailableCopies !== undefined ? neo4j.int(newAvailableCopies) : null,
      });

      // Update author relationship if passed
      if (input.authorId !== undefined) {
        await session.run('MATCH (:Author)-[r:WROTE]->(b:Book {bookId: $bookId}) DELETE r', { bookId });
        if (input.authorId) {
          await session.run(
            'MATCH (a:Author {authorId: $authorId}), (b:Book {bookId: $bookId}) MERGE (a)-[:WROTE]->(b)',
            { authorId: input.authorId, bookId }
          );
        }
      }

      // Update publisher relationship if passed
      if (input.publisherId !== undefined) {
        await session.run('MATCH (:Publisher)-[r:PUBLISHED]->(b:Book {bookId: $bookId}) DELETE r', { bookId });
        if (input.publisherId) {
          await session.run(
            'MATCH (p:Publisher {publisherId: $publisherId}), (b:Book {bookId: $bookId}) MERGE (p)-[:PUBLISHED]->(b)',
            { publisherId: input.publisherId, bookId }
          );
        }
      }

      // Update library relationship if passed
      if (input.libraryId !== undefined) {
        await session.run('MATCH (b:Book {bookId: $bookId})-[r:HELD_BY]->(:Library) DELETE r', { bookId });
        if (input.libraryId) {
          await session.run(
            'MATCH (lib:Library {libraryId: $libraryId}), (b:Book {bookId: $bookId}) MERGE (b)-[:HELD_BY]->(lib)',
            { libraryId: input.libraryId, bookId }
          );
        }
      }

      return BooksService.getBookById(bookId);
    }, { accessMode: 'WRITE' });
  }

  /**
   * Delete book with strict referential integrity check:
   * Prevents deletion if active loans exist.
   */
  static async deleteBook(bookId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        `MATCH (b:Book {bookId: $bookId})
         OPTIONAL MATCH (l:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b)
         RETURN b, count(l) AS activeLoansCount`,
        { bookId }
      );

      if (checkRes.records.length === 0 || !checkRes.records[0].get('b')) {
        throw new NotFoundError(`Book with ID '${bookId}' not found`);
      }

      const activeLoansCount = toNative(checkRes.records[0].get('activeLoansCount')) || 0;
      if (activeLoansCount > 0) {
        throw new ConflictError(
          `Cannot delete book '${bookId}': ${activeLoansCount} active loan(s) currently exist for this book`
        );
      }

      // Safe to detach delete the book node
      await session.run(
        'MATCH (b:Book {bookId: $bookId}) DETACH DELETE b',
        { bookId }
      );
    }, { accessMode: 'WRITE' });
  }
}
