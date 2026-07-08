import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/ui/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import Lesson from './pages/Lesson';
import Practice from './pages/Practice';
import { SongDetail, SongList } from './pages/Songs';
import Tools from './pages/Tools';
import EarTraining from './pages/EarTraining';
import Progress from './pages/Progress';
import { useSettingsStore } from './store/useSettingsStore';

export default function App() {
  const onboarded = useSettingsStore((s) => s.onboarded);

  // Aplica el tema al <html>
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/" element={onboarded ? <Dashboard /> : <Navigate to="/onboarding" replace />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/leccion/:moduleId/:lessonId" element={<Lesson />} />
        <Route path="/practica" element={<Practice />} />
        <Route path="/canciones" element={<SongList />} />
        <Route path="/canciones/:songId" element={<SongDetail />} />
        <Route path="/herramientas" element={<Tools />} />
        <Route path="/oido" element={<EarTraining />} />
        <Route path="/progreso" element={<Progress />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
