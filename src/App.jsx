import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { groceryCatalog } from './data/groceryData';
import { loadCatalogFromCsv } from './data/loadGroceryCatalog';
import { AIChatWidget } from './components/AIChatWidget';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { BuilderPage } from './pages/BuilderPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { LandingPage } from './pages/LandingPage';

function App() {
  const [savedPlan, setSavedPlan] = useState(null);
  const [catalogState, setCatalogState] = useState({
    catalog: groceryCatalog,
    source: 'fallback',
    message: 'Using the built-in grocery catalog.',
  });

  useEffect(() => {
    let isMounted = true;

    loadCatalogFromCsv().then((result) => {
      if (isMounted) {
        setCatalogState(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">BB</span>
          <span>
            <strong>Budget Basket</strong>
            <small>Groceries built for student budgets</small>
          </span>
        </Link>
        <nav className="topnav">
          <Link to="/generator">Generator</Link>
          <Link to="/builder">Builder</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/generator"
            element={
              <GeneratorPage
                catalog={catalogState.catalog}
                savedPlan={savedPlan}
                setSavedPlan={setSavedPlan}
              />
            }
          />
          <Route
            path="/builder"
            element={
              <BuilderPage
                catalog={catalogState.catalog}
                savedPlan={savedPlan}
              />
            }
          />
        </Routes>
      </main>

      <AIChatWidget />
      <ScrollToTopButton />
    </div>
  );
}

export default App;