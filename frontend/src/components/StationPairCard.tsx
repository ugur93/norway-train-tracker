import type { StationDelay } from '../types';

interface StationPairCardProps {
  pair: StationDelay;
}

const getDelayBorderColor = (delay: number) => {
  if (delay < 3) return 'border-l-green-500';
  if (delay < 5) return 'border-l-yellow-500';
  if (delay < 8) return 'border-l-orange-500';
  return 'border-l-red-500';
};

const getDelayTextColor = (delay: number) => {
  if (delay < 3) return 'text-green-600';
  if (delay < 5) return 'text-yellow-600';
  if (delay < 8) return 'text-orange-600';
  return 'text-red-600';
};

const StationPairCard = ({ pair }: StationPairCardProps) => {
  const borderColor = getDelayBorderColor(pair.avg_delay_minutes);
  const textColor = getDelayTextColor(pair.avg_delay_minutes);
  
  return (
    <div className={`flex justify-between items-center p-4 bg-gray-50 border-l-4 ${borderColor} rounded-lg shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="station-info">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {pair.from_stop_name || pair.from_stop} → {pair.to_stop_name || pair.to_stop}
        </h3>
        <div className="text-sm text-gray-600">{pair.delay_count} turer</div>
      </div>
      <div className="delay-info text-right">
        <div className={`text-xl font-bold ${textColor}`}>{pair.avg_delay_minutes.toFixed(1)} min</div>
        <div className="text-xs text-gray-500">avg delay</div>
      </div>
    </div>
  );
};

export default StationPairCard;