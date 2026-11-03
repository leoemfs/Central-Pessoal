import { useEffect, useState, type ComponentType } from 'react';
import { useStore } from './store';
import { Icon, type IconName } from './ui';
import { Dashboard } from './modules/Dashboard';
import { Tarefas } from './modules/Tarefas';
import { Financas } from './modules/Financas';
import { Habitos } from './modules/Habitos';
import { Notas } from './modules/Notas';
import { Agenda } from './modules/Agenda';
import { Ajustes } from './modules/Ajustes';

interface Route {
  path: string;
  label: string;
  icon: IconName;
  view: ComponentType;
}

export const ROUTES: Route[] = [
  { path: 'inicio', label: 'Início', icon: 'home', view: Dashboard },
  { path: 'tarefas', label: 'Tarefas', icon: 'tasks', view: Tarefas },
  { path: 'financas', label: 'Finanças', icon: 'wallet', view: Financas },
  { path: 'habitos', label: 'Hábitos', icon: 'target', view: Habitos },
  { path: 'notas', label: 'Notas', icon: 'note', view: Notas },
  { path: 'agenda', label: 'Agenda', icon: 'calendar', view: Agenda },
  { path: 'ajustes', label: 'Ajustes', icon: 'sliders', view: Ajustes },
];

function currentPath(): string {
  const p = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.some((r) => r.path === p) ? p : 'inicio';
}

function useRoute(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onHash = () => {
      setPath(currentPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return path;
}

export function App() {
  const { data, saveError } = useStore();
  const path = useRoute();
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];
  const View = route.view;

  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = data.settings.theme;
  }, [data.settings.theme]);

  useEffect(() => {
    document.title = route.path === 'inicio' ? 'Central Pessoal' : `${route.label} · Central Pessoal`;
  }, [route]);

  return (
    <div className="shell">
      <nav className="nav" aria-label="Seções">
        <a className="brand" href="#/inicio">
          <img src="./icon.svg" alt="" width={28} height={28} />
          <span>Central Pessoal</span>
        </a>
        <ul>
          {ROUTES.map((r) => (
            <li key={r.path}>
              <a href={`#/${r.path}`} className={r.path === route.path ? 'active' : ''} aria-current={r.path === route.path ? 'page' : undefined}>
                <Icon name={r.icon} />
                <span>{r.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main">
        {saveError && (
          <div className="alert" role="alert">
            Não foi possível salvar no navegador (armazenamento cheio ou bloqueado). Exporte um backup em Ajustes.
          </div>
        )}
        <View key={route.path} />
      </main>
    </div>
  );
}
