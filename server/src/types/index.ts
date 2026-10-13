/**
 * Standardized API Response interface for LibraFlow.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * User roles mapped directly to DA2 entities and permissions.
 */
export type UserRole = 'member' | 'employee' | 'admin';

/**
 * Decoded JWT token payload shape attached to authenticated requests.
 */
export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Domain status enums.
 */
export type MemberStatus = 'ACTIVE' | 'SUSPENDED';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Health check status responses.
 */
export interface LivenessStatus {
  status: 'UP' | 'DOWN';
  uptime: number;
  timestamp: string;
  environment: string;
}

export interface DatabaseReadinessStatus {
  status: 'CONNECTED' | 'DISCONNECTED';
  database: string;
  uri: string;
  serverAddress?: string;
  error?: string;
}

export interface DashboardStats {
  totalBooks: number;
  availableCopies: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  pendingRequests: number;
}

export interface RelatedBooksResult {
  sameAuthor: BookDTO[];
  samePublisher: BookDTO[];
  coBorrowed: BookDTO[];
}

/** Phase 8 — Analytics Aggregation Types */

export interface PopularBook {
  bookId: string;
  title: string;
  author: string;
  genre: string;
  totalBorrows: number;
  currentlyAvailable: number;
}

export interface GenreStats {
  genre: string;
  borrowCount: number;
  uniqueTitles: number;
}

export interface TopBorrower {
  memberId: string;
  name: string;
  totalBorrows: number;
  totalFinesPaid: number;
}

export interface LibraryStock {
  libraryId: string;
  libraryName: string;
  city: string;
  bookCount: number;
  totalStock: number;
  totalAvailable: number;
  staffCount: number;
}

export interface AnalyticsResult {
  popularBooks: PopularBook[];
  genreStats: GenreStats[];
  topBorrowers: TopBorrower[];
  libraryStock: LibraryStock[];
  overdueSnapshot: {
    totalOverdue: number;
    totalActiveFines: number;
    avgDaysOverdue: number;
  };
}

export interface RecommendedBook {
  bookId: string;
  title: string;
  genre: string;
  author: string;
  availableCopies: number;
  coReaderCount: number;
}

export interface MemberRecommendationsResult {
  memberId: string;
  memberName: string;
  recommendations: RecommendedBook[];
}

/**
 * Pagination & Search parameters.
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  genre?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Domain DTOs and Mutation Inputs
 */

// Author
export interface AuthorDTO {
  authorId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  books?: { bookId: string; title: string }[];
}

export interface CreateAuthorInput {
  authorId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
}

export interface UpdateAuthorInput {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
}

// Publisher
export interface PublisherDTO {
  publisherId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  books?: { bookId: string; title: string }[];
}

export interface CreatePublisherInput {
  publisherId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdatePublisherInput {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Book
export interface BookDTO {
  bookId: string;
  isbn: string;
  title: string;
  genre: string;
  language: string;
  edition?: string;
  year: number;
  totalCopies: number;
  availableCopies: number;
  author?: { authorId: string; name: string };
  publisher?: { publisherId: string; name: string };
  library?: { libraryId: string; name: string };
}

export interface CreateBookInput {
  bookId: string;
  isbn: string;
  title: string;
  genre: string;
  language: string;
  edition?: string;
  year: number;
  totalCopies: number;
  authorId?: string;
  publisherId?: string;
  libraryId?: string;
}

export interface UpdateBookInput {
  isbn?: string;
  title?: string;
  genre?: string;
  language?: string;
  edition?: string;
  year?: number;
  totalCopies?: number;
  authorId?: string;
  publisherId?: string;
  libraryId?: string;
}

// Library
export interface LibraryDTO {
  libraryId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  booksCount?: number;
  employeesCount?: number;
}

export interface CreateLibraryInput {
  libraryId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface UpdateLibraryInput {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

// Member
export interface MemberDTO {
  memberId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate: string;
  status: MemberStatus;
  role: 'member';
  activeLoansCount?: number;
}

export interface CreateMemberInput {
  memberId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  status?: MemberStatus;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  status?: MemberStatus;
}

// Employee
export interface EmployeeDTO {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  libraryId: string;
  role: 'employee';
}

export interface CreateEmployeeInput {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  position: string;
  libraryId: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  position?: string;
  libraryId?: string;
}

// Admin
export interface AdminDTO {
  adminId: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface CreateAdminInput {
  adminId: string;
  name: string;
  email: string;
  password?: string;
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  password?: string;
}

// Request
export interface RequestDTO {
  requestId: string;
  requestDate: string;
  status: RequestStatus;
  notes?: string;
  member?: { memberId: string; name: string; email: string };
  book?: { bookId: string; title: string; isbn: string };
  processedBy?: { employeeId: string; name: string };
}

export interface CreateRequestInput {
  requestId: string;
  memberId: string;
  bookId: string;
  notes?: string;
}

export interface UpdateRequestInput {
  status?: RequestStatus;
  notes?: string;
  employeeId?: string; // employee who approves or rejects
}

// Loan
export interface LoanDTO {
  loanId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: LoanStatus;
  fineAmount: number;
  member?: { memberId: string; name: string; email: string };
  book?: { bookId: string; title: string; isbn: string };
  issuedBy?: { employeeId: string; name: string };
}

export interface OverdueLoanDTO extends LoanDTO {
  daysOverdue: number;
  calculatedFine: number;
}

export interface IssueBookInput {
  loanId?: string;
  memberId: string;
  bookId: string;
  employeeId?: string;
  loanPeriodDays?: number;
}

export interface ReturnBookInput {
  returnDate?: string;
  fineRatePerDay?: number;
}

