import { useState, useEffect } from 'react';
import type { StationDelay, StationViewType, TimeFilter, SortOption } from '../types';
import { dataService } from '../services/dataService';
import TimeFilterSelector from './TimeFilterSelector';
import SortSelector from './SortSelector';
import StationCard from './StationCard';
import StationPairCard from './StationPairCard';

const StationDelaysView = () => {
  const [stationView, setStationView] = useState<StationViewType>('individual');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [sortOption, setSortOption] = useState<SortOption>('delay_desc');
  const [data, setData] = useState<StationDelay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stationData = await dataService.fetchStationDelays();
        setData(stationData);
      } catch (error) {
        console.error('Error fetching station data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterDataByTime = (items: StationDelay[]): StationDelay[] => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeFilter) {
      case 'today':
        filterDate.setDate(now.getDate() - 1);
        break;
      case '7days':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        filterDate.setDate(now.getDate() - 30);
        break;
    }

    return items.filter(item => new Date(item.date) >= filterDate);
  };

  const sortData = (items: StationDelay[]): StationDelay[] => {
    return [...items].sort((a, b) => {
      switch (sortOption) {
        case 'delay_desc':
          return b.avg_delay_minutes - a.avg_delay_minutes;
        case 'delay_asc':
          return a.avg_delay_minutes - b.avg_delay_minutes;
        case 'name_asc':
          return a.from_stop.localeCompare(b.from_stop);
        case 'name_desc':
          return b.from_stop.localeCompare(a.from_stop);
        default:
          return 0;
      }
    });
  };

  const getIndividualStations = (): { station: string; avgDelay: number; tripCount: number }[] => {
    const filtered = filterDataByTime(data);
    const stationMap = new Map<string, { totalDelay: number; count: number }>();

    filtered.forEach(item => {
      if (!stationMap.has(item.from_stop)) {
        stationMap.set(item.from_stop, { totalDelay: 0, count: 0 });
      }
      const station = stationMap.get(item.from_stop)!;
      station.totalDelay += item.avg_delay_minutes * item.delay_count;
      station.count += item.delay_count;
    });

    return Array.from(stationMap.entries()).map(([station, stats]) => ({
      station,
      avgDelay: stats.count > 0 ? stats.totalDelay / stats.count : 0,
      tripCount: stats.count,
    }));
  };

  const getStationPairs = (): StationDelay[] => {
    return sortData(filterDataByTime(data.filter(item => item.is_relevant)));
  };

  const individualStations = getIndividualStations();
  const stationPairs = getStationPairs();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Laster data...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs for station views */}
      <div className="flex justify-center mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 flex">
          <button
            onClick={() => setStationView('individual')}
            className={`px-4 py-2 rounded-md transition-all ${
              stationView === 'individual'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Individuelle Stasjoner
          </button>
          <button
            onClick={() => setStationView('pairs')}
            className={`px-4 py-2 rounded-md transition-all ${
              stationView === 'pairs'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Stasjonspar
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-8">
        <TimeFilterSelector value={timeFilter} onChange={setTimeFilter} />
        <SortSelector value={sortOption} onChange={setSortOption} />
      </div>

      {/* Content */}
      {stationView === 'individual' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {individualStations.map((station) => (
            <StationCard
              key={station.station}
              station={station.station}
              avgDelay={station.avgDelay}
              tripCount={station.tripCount}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stationPairs.map((pair, index) => (
            <StationPairCard key={index} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StationDelaysView;