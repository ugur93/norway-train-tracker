import { useState, useEffect } from 'react';
import type { RouteStats, TimeFilter, SortOption } from '../types';
import { dataService } from '../services/dataService';
import TimeFilterSelector from './TimeFilterSelector';
import SortSelector from './SortSelector';
import RouteCard from './RouteCard';

const RouteAveragesView = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [sortOption, setSortOption] = useState<SortOption>('delay_desc');
  const [data, setData] = useState<RouteStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const routeData = await dataService.fetchRouteStats();
        setData(routeData);
      } catch (error) {
        console.error('Error fetching route data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterDataByTime = (items: RouteStats[]): RouteStats[] => {
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

  const sortData = (items: RouteStats[]): RouteStats[] => {
    return [...items].sort((a, b) => {
      switch (sortOption) {
        case 'delay_desc':
          return b.avg_delay_minutes - a.avg_delay_minutes;
        case 'delay_asc':
          return a.avg_delay_minutes - b.avg_delay_minutes;
        case 'name_asc':
          return a.route_name.localeCompare(b.route_name);
        case 'name_desc':
          return b.route_name.localeCompare(a.route_name);
        default:
          return 0;
      }
    });
  };

  const getRouteType = (routeId: string): string => {
    if (routeId.startsWith('FLY')) return 'Flytoget';
    if (routeId.startsWith('L')) return 'Lokaltog';
    if (routeId.startsWith('R')) return 'Regionaltog';
    return 'Annet';
  };

  const filteredAndSortedData = sortData(filterDataByTime(data));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Laster rutedata...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-8">
        <TimeFilterSelector value={timeFilter} onChange={setTimeFilter} />
        <SortSelector value={sortOption} onChange={setSortOption} />
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedData.map((route, index) => (
          <RouteCard
            key={index}
            route={route}
            routeType={getRouteType(route.route_id)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rute Oversikt</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {filteredAndSortedData.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Aktive Ruter</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(filteredAndSortedData.reduce((sum, r) => sum + r.avg_delay_minutes, 0) / filteredAndSortedData.length).toFixed(1)} min
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Gjennomsnittlig Forsinkelse</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {filteredAndSortedData.reduce((sum, r) => sum + r.delay_count, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Totale Turer</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {((filteredAndSortedData.reduce((sum, r) => sum + r.delay_count, 0) * 0.15) / filteredAndSortedData.length * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Estimerte Forsinkede Turer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteAveragesView;