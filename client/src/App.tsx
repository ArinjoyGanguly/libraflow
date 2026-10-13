import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { AddEditBookPage } from './pages/AddEditBookPage';
import { MembersPage } from './pages/MembersPage';
import { StaffPage } from './pages/StaffPage';
import { LibrariesPage } from './pages/LibrariesPage';
import { IssueReturnPage } from './pages/IssueReturnPage';
import { LoansHistoryPage } from './pages/LoansHistoryPage';
import { RequestsPage } from './pages/RequestsPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="books/new" element={<AddEditBookPage />} />
            <Route path="books/:bookId/edit" element={<AddEditBookPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="libraries" element={<LibrariesPage />} />
            <Route path="circulation" element={<IssueReturnPage />} />
            <Route path="loans" element={<LoansHistoryPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="discovery" element={<DiscoveryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
