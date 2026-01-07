import type { RouteStats } from '../types';

interface RouteCardProps {
  route: RouteStats;
  routeType: string;
}

const RouteCard = ({ route, routeType }: RouteCardProps) => {
  const delayPercentage = ((route.delay_count * 0.15) / route.delay_count * 100); // Estimated

  return (
    <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{route.route_name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {routeType} • {route.route_id}
          </p>
        </div>
        <span className="px-2 py-1 rounded text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {route.avg_delay_minutes.toFixed(1)} min
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Gjennomsnittlig forsinkelse:</span>
          <span className="font-semibold ml-2 text-gray-900 dark:text-white">
            {route.avg_delay_minutes.toFixed(1)} min
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Antall turer:</span>
          <span className="font-semibold ml-2 text-gray-900 dark:text-white">{route.delay_count}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total forsinkelse:</span>
          <span className="font-semibold ml-2 text-gray-900 dark:text-white">{route.total_delay_minutes.toFixed(1)} min</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Estimerte forsinkelser:</span>
          <span className="font-semibold ml-2 text-gray-900 dark:text-white">{delayPercentage.toFixed(1)}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-900 dark:text-white">Forsinkelsesprosent:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{delayPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gray-400 dark:bg-gray-500"
            style={{ width: `${Math.min(delayPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;