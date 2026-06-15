import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginPage } from '@/pages/LoginPage';
import { UploadPage } from '@/pages/UploadPage';
import { DownloadPage } from '@/pages/DownloadPage';
import { MyFilesPage } from '@/pages/MyFilesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuthStore } from '@/stores/authStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <Navigate to="/upload" replace />
          </RequireAuth>
        }
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/upload"
        element={
          <RequireAuth>
            <UploadPage />
          </RequireAuth>
        }
      />
      <Route
        path="/files"
        element={
          <RequireAuth>
            <MyFilesPage />
          </RequireAuth>
        }
      />
      <Route path="/d/:token" element={<DownloadPage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
