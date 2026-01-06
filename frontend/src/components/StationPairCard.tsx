import type { StationDelay } from '../types';
import { getDelayColor } from '../types';

interface StationPairCardProps {
  pair: StationDelay;
}

const StationPairCard = ({ pair }: StationPairCardProps) => {
  const delayColor = getDelayColor(pair.avg_delay_minutes);

  return (
    <div className={`p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${delayColor.border}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {pair.from_stop} → {pair.to_stop}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {pair.date}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-sm font-medium ${delayColor.bg} ${delayColor.text}`}>
          {pair.avg_delay_minutes.toFixed(1)} min
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Forsinkelse:</span>
          <span className={`font-semibold ml-2 ${delayColor.text}`}>
            {pair.avg_delay_minutes.toFixed(1)} min
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Antall turer:</span>
          <span className="font-semibold ml-2 text-gray-900 dark:text-white">{pair.delay_count}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total forsinkelse:</span>
          <span className="font-semibold ml-2 text-gray-900 dark:text-white">{pair.total_delay_minutes.toFixed(1)} min</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${pair.avg_delay_minutes < 3 ? 'bg-green-500' : pair.avg_delay_minutes < 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min((pair.avg_delay_minutes / 10) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StationPairCard;