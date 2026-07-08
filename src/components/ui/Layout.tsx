import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Dumbbell, Home, Sliders, Ear, Trophy } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/curriculum', label: 'Lecciones', icon: BookOpen },
  { to: '/practica', label: 'Práctica', icon: Dumbbell },
  { to: '/oido', label: 'Oído', icon: Ear },
  { to: '/herramientas', label: 'Herramientas', icon: Sliders },
  { to: '/progreso', label: 'Progreso', icon: Trophy },
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-full flex flex-col md:flex-row">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden md:flex md:w-60 shrink-0 flex-col gap-1 p-4 border-r border-white/5">
        <div className="flex items-center gap-2 px-2 py-4">
          <span className="text-2xl">🎹</span>
          <span className="font-semibold text-lg">PianoApp</span>
        </div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                isActive ? 'bg-piano-primary/20 text-white' : 'text-piano-muted hover:bg-white/5'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </aside>

      {/* Contenido */}
      <main className="flex-1 min-w-0 pb-24 md:pb-6">
        <div className="mx-auto max-w-3xl px-4 py-6" key={pathname}>
          <Outlet />
        </div>
      </main>

      {/* Barra inferior (móvil) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-piano-surface/95 backdrop-blur">
        <div className="flex justify-around">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                  isActive ? 'text-piano-primary' : 'text-piano-muted'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
