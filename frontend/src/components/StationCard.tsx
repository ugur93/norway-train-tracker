interface StationCardProps {
  station: string;
  avgDelay: number;
  tripCount: number;
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

const StationCard = ({ station, avgDelay, tripCount }: StationCardProps) => {
  const borderColor = getDelayBorderColor(avgDelay);
  const textColor = getDelayTextColor(avgDelay);
  
  return (
    <div className={`flex justify-between items-center p-4 bg-gray-50 border-l-4 ${borderColor} rounded-lg shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="station-info">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{station}</h3>
        <div className="text-sm text-gray-600">{tripCount} turer</div>
      </div>
      <div className="delay-info text-right">
        <div className={`text-xl font-bold ${textColor}`}>{avgDelay.toFixed(1)} min</div>
        <div className="text-xs text-gray-500">avg delay</div>
      </div>
    </div>
  );
};

export default StationCard;