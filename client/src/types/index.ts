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
  totalBooks: number;
  availableCopies: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  pendingRequests: number;
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
