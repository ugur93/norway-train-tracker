import type { ViewType } from '../types';

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewSelector = ({ currentView, onViewChange }: ViewSelectorProps) => {
  const views = [
    { id: 'stations' as ViewType, label: '📍 Stasjonsforsinkelser', description: 'Individuelle stasjoner og stasjonspar' },
    { id: 'routes' as ViewType, label: '🛤️ Rute Gjennomsnitt', description: 'Aggregert ytelse per rute' },
    { id: 'analytics' as ViewType, label: '📈 Analyse', description: 'Avanserte innsikter og trender' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex space-x-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`px-6 py-3 rounded-md transition-all duration-200 ${
              currentView === view.id
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="font-semibold">{view.label}</div>
            <div className="text-sm opacity-75">{view.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewSelector;