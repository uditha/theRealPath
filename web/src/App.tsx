import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import WorldsPage from './pages/admin/Worlds';
import WorldChaptersPage from './pages/admin/WorldChapters';
import ChaptersPage from './pages/admin/Chapters';
import LessonsPage from './pages/admin/Lessons';
import ChapterLessonsPage from './pages/admin/ChapterLessons';
import LessonEditor from './pages/admin/LessonEditor';
import CardsPage from './pages/admin/Cards';
import UsersPage from './pages/admin/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const httpError = error as { response?: { status?: number } };
        if (httpError?.response?.status === 401 || httpError?.response?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/admin" replace /> : <Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/worlds"
        element={
          <PrivateRoute>
            <WorldsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/worlds/:worldId/chapters"
        element={
          <PrivateRoute>
            <WorldChaptersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/chapters"
        element={
          <PrivateRoute>
            <ChaptersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/chapters/:chapterId/lessons"
        element={
          <PrivateRoute>
            <ChapterLessonsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/lessons"
        element={
          <PrivateRoute>
            <LessonsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/lessons/new"
        element={
          <PrivateRoute>
            <LessonEditor />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/lessons/:id/edit"
        element={
          <PrivateRoute>
            <LessonEditor />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/cards"
        element={
          <PrivateRoute>
            <CardsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

