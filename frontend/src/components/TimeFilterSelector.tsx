import type { TimeFilter } from '../types';

interface TimeFilterSelectorProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}

const TimeFilterSelector = ({ value, onChange }: TimeFilterSelectorProps) => {
  const options = [
    { value: 'today' as TimeFilter, label: 'I dag' },
    { value: '7days' as TimeFilter, label: '7 dager' },
    { value: '30days' as TimeFilter, label: '30 dager' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
      <label className="font-medium text-gray-700 text-sm">Periode:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeFilter)}
        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
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