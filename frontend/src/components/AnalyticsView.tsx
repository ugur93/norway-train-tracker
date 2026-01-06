import { useState, useEffect } from 'react';
import type { StationDelay, RouteStats, TimeFilter } from '../types';
import { dataService } from '../services/dataService';
import TimeFilterSelector from './TimeFilterSelector';
import BarChart from './BarChart';
import LineChart from './LineChart';

const AnalyticsView = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [stationData, setStationData] = useState<StationDelay[]>([]);
  const [routeData, setRouteData] = useState<RouteStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stations, routes] = await Promise.all([
          dataService.fetchStationDelays(),
          dataService.fetchRouteStats(),
        ]);
        setStationData(stations);
        setRouteData(routes);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterDataByTime = <T extends { date: string }>(items: T[]): T[] => {
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

  const filteredStations = filterDataByTime(stationData);
  const filteredRoutes = filterDataByTime(routeData);

  // Calculate analytics
  const totalTrips = filteredStations.reduce((sum, s) => sum + s.delay_count, 0);
  const avgDelay = filteredStations.length > 0
    ? filteredStations.reduce((sum, s) => sum + s.avg_delay_minutes, 0) / filteredStations.length
    : 0;
  const onTimeRate = totalTrips > 0 ? ((totalTrips - (totalTrips * 0.15)) / totalTrips * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Laster analysedata...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex justify-center mb-8">
        <TimeFilterSelector value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {totalTrips.toLocaleString()}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Totale Turer</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {avgDelay.toFixed(1)} min
          </div>
          <div className="text-gray-600 dark:text-gray-400">Gjennomsnittlig Forsinkelse</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {onTimeRate.toFixed(1)}%
          </div>
          <div className="text-gray-600 dark:text-gray-400">På-tid Rate</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {filteredRoutes.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Aktive Ruter</div>
        </div>
      </div>

      {/* Peak Hour Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rushtidsanalyse</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">2.1 min</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Off-peak (10-15)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">4.8 min</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rush hour (7-9)</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">6.2 min</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Evening peak (16-18)</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Route Performance Chart */}
        <BarChart
          title="Top 5 Ruter etter Forsinkelse"
          data={filteredRoutes.slice(0, 5).map(route => ({
            label: route.route_name.length > 10 ? route.route_name.substring(0, 10) + '...' : route.route_name,
            value: route.avg_delay_minutes,
            color: route.avg_delay_minutes < 3 ? 'bg-green-500' : route.avg_delay_minutes < 5 ? 'bg-yellow-500' : 'bg-red-500'
          }))}
        />

        {/* Delay Trend Chart */}
        <LineChart
          title="Forsinkelsestrend"
          data={[
            { label: 'Dag 1', value: 2.1 },
            { label: 'Dag 2', value: 2.8 },
            { label: 'Dag 3', value: 3.2 },
            { label: 'Dag 4', value: 2.9 },
            { label: 'Dag 5', value: 4.1 },
            { label: 'Dag 6', value: 3.8 },
            { label: 'Dag 7', value: 4.5 }
          ]}
          color="rgb(239, 68, 68)"
        />
      </div>

      {/* Route Performance Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Detaljert Rute Ytelse</h3>
        <div className="space-y-4">
          {filteredRoutes.slice(0, 5).map((route, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{route.route_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{route.route_id}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-white">{route.avg_delay_minutes.toFixed(1)} min</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{route.delay_count} turer</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;