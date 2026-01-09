import { useState, useEffect } from 'react';
import type { ViewType, TimeFilter, SystemHealth, RouteWithPunctuality, StationDelay } from './types';
import { dataService } from './services/dataService';
import { getDelayColor, getPunctualityColor, calculatePunctuality, getRouteTypeIcon } from './types';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Data states
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    totalTrips: 0,
    onTimeTrips: 0,
    punctualityPct: 0,
    avgDelayMinutes: 0,
    activeRoutes: 0,
    delayedTrips: 0
  });
  const [topRoutes, setTopRoutes] = useState<RouteWithPunctuality[]>([]);
  const [topStations, setTopStations] = useState<StationDelay[]>([]);
  const [allRoutes, setAllRoutes] = useState<RouteWithPunctuality[]>([]);
  const [allStations, setAllStations] = useState<StationDelay[]>([]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [health, routes, stations, routeStats, stationStats] = await Promise.all([
        dataService.fetchSystemHealth(),
        dataService.fetchTopDelayedRoutes(5),
        dataService.fetchTopDelayedStations(10),
        dataService.fetchRoutesWithPunctuality(),
        dataService.fetchStationDelays()
      ]);

      setSystemHealth(health);
      setTopRoutes(routes);
      setTopStations(stations);
      setAllRoutes(routeStats);
      setAllStations(stationStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return 'Akkurat nå';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minutt siden';
    return `${minutes} minutter siden`;
  };

  // Filter data by time
  const getFilteredRoutes = () => {
    const filtered = dataService.filterByTime(allRoutes, timeFilter);
    return dataService.aggregateRouteStats(filtered)
      .sort((a, b) => b.avg_delay_minutes - a.avg_delay_minutes);
  };

  const getFilteredStations = () => {
    const filtered = dataService.filterByTime(allStations, timeFilter);
    return dataService.aggregateStationDelays(filtered)
      .sort((a, b) => b.avg_delay_minutes - a.avg_delay_minutes);
  };

  // Render Overview View
  const renderOverview = () => (
    <>
      {/* System Health Cards */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[#0f172a] text-xl font-bold leading-tight">Systemhelse</h2>
      </div>

      <div className="flex flex-wrap gap-3 px-4 pb-4">
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#135bec] text-lg">schedule</span>
            <p className="text-[#64748b] text-xs font-medium">Punktlighet</p>
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-bold leading-none ${getPunctualityColor(systemHealth.punctualityPct).text}`}>
              {systemHealth.punctualityPct}%
            </p>
          </div>
        </div>

        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#ff9f0a] text-lg">schedule</span>
            <p className="text-[#64748b] text-xs font-medium">Snittforsinkelse</p>
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-bold leading-none ${getDelayColor(systemHealth.avgDelayMinutes).text}`}>
              +{systemHealth.avgDelayMinutes}m
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-4 pb-4">
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#135bec] text-lg">train</span>
            <p className="text-[#64748b] text-xs font-medium">Totale avganger</p>
          </div>
          <p className="text-2xl font-bold leading-none text-[#0f172a]">
            {systemHealth.totalTrips.toLocaleString()}
          </p>
        </div>

        <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#ff453a] text-lg">warning</span>
            <p className="text-[#64748b] text-xs font-medium">Forsinkede</p>
          </div>
          <p className="text-2xl font-bold leading-none text-[#0f172a]">
            {systemHealth.delayedTrips.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Delayed Routes */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-end">
        <h2 className="text-[#0f172a] text-lg font-bold leading-tight">Mest forsinkede ruter</h2>
        <button
          onClick={() => setActiveView('routes')}
          className="text-[#135bec] text-sm font-semibold"
        >
          Se alle
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-4">
        {topRoutes.slice(0, 5).map((route, index) => {
          const punctuality = calculatePunctuality(route.total_trips, route.on_time_trips);
          const delayColor = getDelayColor(route.avg_delay_minutes);

          return (
            <div
              key={`${route.route_id}-${index}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#64748b]">
                    {getRouteTypeIcon(route.route_id)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{route.route_id}</p>
                  <p className="text-xs text-[#64748b]">{route.route_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-bold ${delayColor.text}`}>+{route.avg_delay_minutes.toFixed(1)}m</p>
                  <p className="text-xs text-[#64748b]">{punctuality}% i rute</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Delayed Station Pairs */}
      <div className="px-4 pt-2 pb-2 flex justify-between items-end">
        <h2 className="text-[#0f172a] text-lg font-bold leading-tight">Mest forsinkede stasjonspar</h2>
        <button
          onClick={() => setActiveView('stations')}
          className="text-[#135bec] text-sm font-semibold"
        >
          Se alle
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-8">
        {topStations.slice(0, 5).map((station, index) => {
          const delayColor = getDelayColor(station.avg_delay_minutes);
          const punctuality = calculatePunctuality(station.total_trips, station.on_time_trips);

          return (
            <div
              key={`${station.from_stop}-${station.to_stop}-${index}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0f172a]">
                  {station.from_stop_name} → {station.to_stop_name}
                </p>
                <p className="text-xs text-[#64748b]">
                  {station.total_trips} avganger • {punctuality}% i rute
                </p>
              </div>
              <div className={`px-2 py-1 rounded ${delayColor.bg}`}>
                <span className={`text-sm font-bold ${delayColor.text}`}>
                  +{station.avg_delay_minutes.toFixed(1)}m
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  // Render Routes View
  const renderRoutes = () => {
    const filteredRoutes = getFilteredRoutes();

    return (
      <>
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[#0f172a] text-xl font-bold leading-tight">Alle ruter</h2>
          <p className="text-[#64748b] text-sm">{filteredRoutes.length} ruter</p>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-8">
          {filteredRoutes.map((route, index) => {
            const punctuality = calculatePunctuality(route.total_trips, route.on_time_trips);
            const delayColor = getDelayColor(route.avg_delay_minutes);
            const punctualityColor = getPunctualityColor(punctuality);

            return (
              <div
                key={`${route.route_id}-${index}`}
                className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#135bec]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#135bec] text-xl">
                        {getRouteTypeIcon(route.route_id)}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#0f172a]">{route.route_id}</p>
                      <p className="text-sm text-[#64748b]">{route.route_name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-2 rounded-lg bg-white border border-slate-100">
                    <p className="text-xs text-[#64748b]">Punktlighet</p>
                    <p className={`text-lg font-bold ${punctualityColor.text}`}>{punctuality}%</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-white border border-slate-100">
                    <p className="text-xs text-[#64748b]">Snittforsinkelse</p>
                    <p className={`text-lg font-bold ${delayColor.text}`}>+{route.avg_delay_minutes.toFixed(1)}m</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-white border border-slate-100">
                    <p className="text-xs text-[#64748b]">Avganger</p>
                    <p className="text-lg font-bold text-[#0f172a]">{route.total_trips}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // Render Stations View
  const renderStations = () => {
    const filteredStations = getFilteredStations();

    return (
      <>
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[#0f172a] text-xl font-bold leading-tight">Alle stasjonspar</h2>
          <p className="text-[#64748b] text-sm">{filteredStations.length} stasjonspar</p>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-8">
          {filteredStations.map((station, index) => {
            const punctuality = calculatePunctuality(station.total_trips, station.on_time_trips);
            const delayColor = getDelayColor(station.avg_delay_minutes);
            const punctualityColor = getPunctualityColor(punctuality);

            return (
              <div
                key={`${station.from_stop}-${station.to_stop}-${index}`}
                className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-[#0f172a]">
                      {station.from_stop_name} → {station.to_stop_name}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${delayColor.bg}`}>
                    <span className={`text-sm font-bold ${delayColor.text}`}>
                      +{station.avg_delay_minutes.toFixed(1)}m
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-2 rounded-lg bg-white border border-slate-100">
                    <p className="text-xs text-[#64748b]">Punktlighet</p>
                    <p className={`text-lg font-bold ${punctualityColor.text}`}>{punctuality}%</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-white border border-slate-100">
                    <p className="text-xs text-[#64748b]">Totale avganger</p>
                    <p className="text-lg font-bold text-[#0f172a]">{station.total_trips}</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-white border border-slate-100">
                    <p className="text-xs text-[#64748b]">Forsinkede</p>
                    <p className="text-lg font-bold text-[#ff453a]">{station.delay_count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // Render Analytics View
  const renderAnalytics = () => {
    const filteredRoutes = getFilteredRoutes();
    const filteredStations = getFilteredStations();

    const totalTrips = filteredRoutes.reduce((sum, r) => sum + r.total_trips, 0);
    const totalOnTime = filteredRoutes.reduce((sum, r) => sum + r.on_time_trips, 0);
    const avgPunctuality = totalTrips > 0 ? Math.round((totalOnTime / totalTrips) * 100) : 0;

    return (
      <>
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[#0f172a] text-xl font-bold leading-tight">Analyse</h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-[#64748b] mb-1">Total punktlighet</p>
            <p className={`text-2xl font-bold ${getPunctualityColor(avgPunctuality).text}`}>{avgPunctuality}%</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-[#64748b] mb-1">Totale avganger</p>
            <p className="text-2xl font-bold text-[#0f172a]">{totalTrips.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-[#64748b] mb-1">Aktive ruter</p>
            <p className="text-2xl font-bold text-[#0f172a]">{filteredRoutes.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-[#64748b] mb-1">Stasjonspar</p>
            <p className="text-2xl font-bold text-[#0f172a]">{filteredStations.length}</p>
          </div>
        </div>

        {/* Worst Performing Routes */}
        <div className="px-4 pt-2 pb-2">
          <h3 className="text-[#0f172a] text-lg font-bold">Dårligst punktlighet</h3>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4">
          {filteredRoutes
            .sort((a, b) => {
              const pctA = a.total_trips > 0 ? (a.on_time_trips / a.total_trips) * 100 : 100;
              const pctB = b.total_trips > 0 ? (b.on_time_trips / b.total_trips) * 100 : 100;
              return pctA - pctB;
            })
            .slice(0, 5)
            .map((route, index) => {
              const punctuality = calculatePunctuality(route.total_trips, route.on_time_trips);
              const punctualityColor = getPunctualityColor(punctuality);

              return (
                <div
                  key={`worst-${route.route_id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{route.route_id}</p>
                    <p className="text-xs text-[#64748b]">{route.total_trips} avganger</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${punctualityColor.bg}`}>
                    <span className={`text-sm font-bold ${punctualityColor.text}`}>{punctuality}%</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Best Performing Routes */}
        <div className="px-4 pt-2 pb-2">
          <h3 className="text-[#0f172a] text-lg font-bold">Best punktlighet</h3>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-8">
          {filteredRoutes
            .filter(r => r.total_trips > 0)
            .sort((a, b) => {
              const pctA = (a.on_time_trips / a.total_trips) * 100;
              const pctB = (b.on_time_trips / b.total_trips) * 100;
              return pctB - pctA;
            })
            .slice(0, 5)
            .map((route, index) => {
              const punctuality = calculatePunctuality(route.total_trips, route.on_time_trips);
              const punctualityColor = getPunctualityColor(punctuality);

              return (
                <div
                  key={`best-${route.route_id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{route.route_id}</p>
                    <p className="text-xs text-[#64748b]">{route.total_trips} avganger</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${punctualityColor.bg}`}>
                    <span className={`text-sm font-bold ${punctualityColor.text}`}>{punctuality}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </>
    );
  };

  return (
    <div className="bg-[#f6f6f8] font-display antialiased text-[#0f172a] pb-24">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-white border-x border-slate-200">

        {/* TopAppBar */}
        <div className="sticky top-0 z-50 flex items-center bg-white/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-200">
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-[#0f172a]">
            {activeView === 'overview' && 'Oslo Region'}
            {activeView === 'routes' && 'Ruter'}
            {activeView === 'stations' && 'Stasjoner'}
            {activeView === 'analytics' && 'Analyse'}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-slate-100 text-[#0f172a] transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[24px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-[#64748b] text-xs font-normal leading-normal pb-3 pt-2 px-4 text-center">
          Sist oppdatert: {getTimeAgo()}
        </p>

        {/* Time Filter Chips */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {(['today', '24hours', '7days', '30days'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-transform active:scale-95 text-sm ${
                timeFilter === filter
                  ? 'bg-[#135bec] shadow-lg shadow-[#135bec]/25 text-white font-semibold'
                  : 'bg-slate-100 border border-slate-200 text-[#334155] font-medium hover:bg-slate-200'
              }`}
            >
              {filter === 'today' && 'I dag'}
              {filter === '24hours' && '24 timer'}
              {filter === '7days' && '7 dager'}
              {filter === '30days' && '30 dager'}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && allRoutes.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-[#135bec] rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-lg text-[#334155] font-medium">Laster togdata...</p>
          </div>
        ) : (
          <>
            {activeView === 'overview' && renderOverview()}
            {activeView === 'routes' && renderRoutes()}
            {activeView === 'stations' && renderStations()}
            {activeView === 'analytics' && renderAnalytics()}
          </>
        )}

        {/* Spacer for bottom nav */}
        <div className="h-8"></div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe pt-2">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveView('overview')}
            className="flex flex-col items-center justify-center gap-1 w-16 group"
          >
            <span className={`material-symbols-outlined text-2xl transition-all ${
              activeView === 'overview'
                ? 'text-[#135bec] scale-110'
                : 'text-[#94a3b8] group-hover:text-[#135bec] group-hover:scale-110'
            }`}>dashboard</span>
            <span className={`text-[10px] font-medium transition-colors ${
              activeView === 'overview' ? 'text-[#135bec]' : 'text-[#94a3b8] group-hover:text-[#135bec]'
            }`}>Oversikt</span>
          </button>
          <button
            onClick={() => setActiveView('routes')}
            className="flex flex-col items-center justify-center gap-1 w-16 group"
          >
            <span className={`material-symbols-outlined text-2xl transition-all ${
              activeView === 'routes'
                ? 'text-[#135bec] scale-110'
                : 'text-[#94a3b8] group-hover:text-[#135bec] group-hover:scale-110'
            }`}>route</span>
            <span className={`text-[10px] font-medium transition-colors ${
              activeView === 'routes' ? 'text-[#135bec]' : 'text-[#94a3b8] group-hover:text-[#135bec]'
            }`}>Ruter</span>
          </button>
          <button
            onClick={() => setActiveView('stations')}
            className="flex flex-col items-center justify-center gap-1 w-16 group"
          >
            <span className={`material-symbols-outlined text-2xl transition-all ${
              activeView === 'stations'
                ? 'text-[#135bec] scale-110'
                : 'text-[#94a3b8] group-hover:text-[#135bec] group-hover:scale-110'
            }`}>train</span>
            <span className={`text-[10px] font-medium transition-colors ${
              activeView === 'stations' ? 'text-[#135bec]' : 'text-[#94a3b8] group-hover:text-[#135bec]'
            }`}>Stasjoner</span>
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className="flex flex-col items-center justify-center gap-1 w-16 group"
          >
            <span className={`material-symbols-outlined text-2xl transition-all ${
              activeView === 'analytics'
                ? 'text-[#135bec] scale-110'
                : 'text-[#94a3b8] group-hover:text-[#135bec] group-hover:scale-110'
            }`}>analytics</span>
            <span className={`text-[10px] font-medium transition-colors ${
              activeView === 'analytics' ? 'text-[#135bec]' : 'text-[#94a3b8] group-hover:text-[#135bec]'
            }`}>Analyse</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
