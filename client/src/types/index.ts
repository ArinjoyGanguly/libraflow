export type UserRole = 'member' | 'employee' | 'admin';
export type MemberStatus = 'ACTIVE' | 'SUSPENDED';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Author {
  authorId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  books?: { bookId: string; title: string }[];
}

export interface Publisher {
  publisherId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  books?: { bookId: string; title: string }[];
}

export interface Book {
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

export interface Library {
  libraryId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  booksCount?: number;
  employeesCount?: number;
}

export interface Member {
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

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  libraryId: string;
  role: 'employee';
}

export interface Admin {
  adminId: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface Loan {
  loanId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: LoanStatus;
  fineAmount: number;
  member?: { memberId: string; name: string; email: string };
  book?: { bookId: string; title: string; isbn: string };
  issuedBy?: { employeeId: string; name: string };
  daysOverdue?: number;
  calculatedFine?: number;
}

export interface OverdueLoan extends Loan {
  daysOverdue: number;
  calculatedFine: number;
}

export interface RequestItem {
  requestId: string;
  requestDate: string;
  status: RequestStatus;
  notes?: string;
  member?: { memberId: string; name: string; email: string };
  book?: { bookId: string; title: string; isbn: string };
  processedBy?: { employeeId: string; name: string };
}

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface DashboardStats {
  totalBooks?: number;
  availableCopies?: number;
  totalMembers?: number;
  activeLoans?: number;
  overdueLoans?: number;
  pendingRequests?: number;
  // Backend /api/admin/stats properties
  booksCount?: number;
  membersCount?: number;
  activeLoansCount?: number;
  overdueLoansCount?: number;
  totalLoansCount?: number;
  requestsCount?: number;
  librariesCount?: number;
}

export interface RelatedBooksResult {
  focalBook?: Book | null;
  sameAuthor: Book[];
  samePublisher: Book[];
  coBorrowed: Book[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  genre?: string;
  status?: string;
  memberId?: string;
  bookId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export interface CreateMemberInput {
  memberId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  status?: MemberStatus;
}

export interface CreateEmployeeInput {
  employeeId?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  position: string;
  libraryId: string;
}

export interface CreateAdminInput {
  adminId?: string;
  name: string;
  email: string;
  password?: string;
}

export interface CreateLibraryInput {
  libraryId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface CreateRequestInput {
  requestId?: string;
  memberId: string;
  bookId: string;
  notes?: string;
}

export interface UpdateRequestInput {
  status?: RequestStatus;
  notes?: string;
  employeeId?: string;
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

// ==========================================
// Phase 8: Analytics & Recommendations Types
// ==========================================

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

export interface OverdueSnapshot {
  totalOverdue: number;
  totalActiveFines: number;
  avgDaysOverdue: number;
}

export interface AnalyticsResult {
  popularBooks: PopularBook[];
  genreStats: GenreStats[];
  topBorrowers: TopBorrower[];
  libraryStock: LibraryStock[];
  overdueSnapshot: OverdueSnapshot;
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

