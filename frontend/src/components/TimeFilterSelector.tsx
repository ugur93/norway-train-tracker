import type { TimeFilter } from '../types';

interface TimeFilterSelectorProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}

const TimeFilterSelector = ({ value, onChange }: TimeFilterSelectorProps) => {
  const options = [
    { value: 'today' as TimeFilter, label: 'I Dag' },
    { value: '7days' as TimeFilter, label: 'Siste 7 Dager' },
    { value: '30days' as TimeFilter, label: 'Siste 30 Dager' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label className="font-medium text-gray-700 dark:text-gray-300">Tidsperiode:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeFilter)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimeFilterSelector;