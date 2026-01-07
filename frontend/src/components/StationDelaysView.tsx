import { useState, useEffect } from 'react';
import type { StationDelay, StationViewType, TimeFilter, SortOption } from '../types';
import { dataService } from '../services/dataService';
import StationCard from './StationCard';
import StationPairCard from './StationPairCard';

const StationDelaysView = () => {
  const [stationView, setStationView] = useState<StationViewType>('pairs');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [sortOption, setSortOption] = useState<SortOption>('delay_desc');
  const [data, setData] = useState<StationDelay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const stationData = await dataService.fetchStationDelays();
        console.log('Fetched station data:', stationData);
        setData(stationData);
      } catch (error) {
        console.error('Error fetching station data:', error);
        setError('Kunne ikke laste data. Prøv igjen senere.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
          return (a.from_stop_name || a.from_stop).localeCompare(b.from_stop_name || b.from_stop);
        case 'name_desc':
          return (b.from_stop_name || b.from_stop).localeCompare(a.from_stop_name || a.from_stop);
        default:
          return 0;
      }
    });
  };

  const getIndividualStations = (): { station: string; avgDelay: number; tripCount: number }[] => {
    const filtered = filterDataByTime(data);
    const stationMap = new Map<string, { totalDelay: number; count: number }>();

    filtered.forEach(item => {
      const stationName = item.from_stop_name || item.from_stop;
      if (!stationMap.has(stationName)) {
        stationMap.set(stationName, { totalDelay: 0, count: 0 });
      }
      const station = stationMap.get(stationName)!;
      station.totalDelay += item.avg_delay_minutes * item.delay_count;
      station.count += item.delay_count;
    });

    return Array.from(stationMap.entries())
      .map(([station, stats]) => ({
        station,
        avgDelay: stats.count > 0 ? stats.totalDelay / stats.count : 0,
        tripCount: stats.count,
      }))
      .sort((a, b) => {
        switch (sortOption) {
          case 'delay_desc':
            return b.avgDelay - a.avgDelay;
          case 'delay_asc':
            return a.avgDelay - b.avgDelay;
          case 'name_asc':
            return a.station.localeCompare(b.station);
          case 'name_desc':
            return b.station.localeCompare(a.station);
          default:
            return 0;
        }
      });
  };

  const getStationPairs = (): StationDelay[] => {
    return sortData(filterDataByTime(data.filter(item => item.is_relevant)));
  };

  const individualStations = getIndividualStations();
  const stationPairs = getStationPairs();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-2xl">🚂</span>
          </div>
        </div>
        <p className="mt-6 text-lg text-gray-700 font-medium">Laster togdata...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-lg text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Last inn på nytt
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg text-gray-700 font-medium">Ingen data tilgjengelig ennå</p>
        <p className="text-sm text-gray-500 mt-2">Data oppdateres hvert 10. minutt</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs for station views */}
      <div className="sub-tabs">
        <button
          onClick={() => setStationView('pairs')}
          className={`sub-tab-btn ${stationView === 'pairs' ? 'active' : ''}`}
        >
          🚉 Stasjonspar
        </button>
        <button
          onClick={() => setStationView('individual')}
          className={`sub-tab-btn ${stationView === 'individual' ? 'active' : ''}`}
        >
          📍 Enkeltstasjoner
        </button>
      </div>

      {/* Controls */}
      <div className="view-controls">
        <div className="time-filter">
          <label>Periode:</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="time-select"
          >
            <option value="today">I dag</option>
            <option value="7days">7 dager</option>
            <option value="30days">30 dager</option>
          </select>
        </div>
        <div className="sort-controls">
          <label>Sorter:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="delay_desc">Størst forsinkelse først</option>
            <option value="delay_asc">Minst forsinkelse først</option>
            <option value="name_asc">Navn A-Å</option>
            <option value="name_desc">Navn Å-A</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {stationView === 'pairs' ? (
        <div>
          {stationPairs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen data for valgt tidsperiode</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {stationPairs.map((pair, index) => (
                <StationPairCard key={`${pair.from_stop}-${pair.to_stop}-${index}`} pair={pair} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {individualStations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen data for valgt tidsperiode</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {individualStations.map((station) => (
                <StationCard
                  key={station.station}
                  station={station.station}
                  avgDelay={station.avgDelay}
                  tripCount={station.tripCount}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationDelaysView;