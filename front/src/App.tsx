import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
    </Routes>
  );
}
