import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import ArchivePage from './pages/ArchivePage';

function App() {
  // Basit client-side routing
  const path = window.location.pathname;

  return (
    <AppProvider>
      {path === '/arsiv' || path === '/archive' ? <ArchivePage /> : <HomePage />}
    </AppProvider>
  );
}

export default App;
