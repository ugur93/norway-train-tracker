import { useState } from 'react';
import type { ViewType } from './types';
import ViewSelector from './components/ViewSelector';
import StationDelaysView from './components/StationDelaysView';
import RouteAveragesView from './components/RouteAveragesView';
import AnalyticsView from './components/AnalyticsView';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('stations');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'stations':
        return <StationDelaysView />;
      case 'routes':
        return <RouteAveragesView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <StationDelaysView />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <header className="header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Togforsinkelses Dashboard
            </h1>
            <p className="text-lg md:text-xl text-white opacity-90">
              Sanntidsdata for togtrafikkforsinkelser i Oslo-regionen
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
        <div className="mt-6 md:mt-8">
          {renderCurrentView()}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Data fra Entur API • Oppdateres hvert 10. minutt</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
