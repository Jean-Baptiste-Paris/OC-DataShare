import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginPage } from '@/pages/LoginPage';
import { UploadPage } from '@/pages/UploadPage';
import { useAuthStore } from '@/stores/authStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
    </Routes>
  );
}
