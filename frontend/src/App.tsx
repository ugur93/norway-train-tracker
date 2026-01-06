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
    <div className="min-h-screen bg-gray-900 dark">
      <header className="bg-gradient-to-r from-blue-700 to-purple-700 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">
            🚂 Togforsinkelses Dashboard
          </h1>
          <p className="text-center text-blue-100">
            Oslo-regionen togtrafikk oversikt
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
