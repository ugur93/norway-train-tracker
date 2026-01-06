import { getDelayColor } from '../types';

interface StationCardProps {
  station: string;
  avgDelay: number;
  tripCount: number;
}

const StationCard = ({ station, avgDelay, tripCount }: StationCardProps) => {
  const delayColor = getDelayColor(avgDelay);

  return (
    <div className={`p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${delayColor.border}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{station}</h3>
        <span className={`px-2 py-1 rounded text-sm font-medium ${delayColor.bg} ${delayColor.text}`}>
          {avgDelay.toFixed(1)} min
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Gjennomsnittlig forsinkelse:</span>
          <span className={`font-semibold ${delayColor.text}`}>
            {avgDelay.toFixed(1)} minutter
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Antall turer:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{tripCount}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${avgDelay < 3 ? 'bg-green-500' : avgDelay < 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min((avgDelay / 10) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StationCard;