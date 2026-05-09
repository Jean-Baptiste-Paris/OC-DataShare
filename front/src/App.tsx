import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginPage } from '@/pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
    </Routes>
  );
}
