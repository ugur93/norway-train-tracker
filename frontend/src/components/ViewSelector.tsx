import type { ViewType } from '../types';

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewSelector = ({ currentView, onViewChange }: ViewSelectorProps) => {
  const views = [
    { id: 'stations' as ViewType, label: '📍 Stasjoner', description: 'Forsinkelser per stasjon' },
    { id: 'routes' as ViewType, label: '🛤️ Ruter', description: 'Gjennomsnitt per rute' },
    { id: 'analytics' as ViewType, label: '📈 Analyse', description: 'Trender og innsikt' },
  ];

  return (
    <div className="view-selector">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`view-btn ${currentView === view.id ? 'active' : ''}`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
};

export default ViewSelector;