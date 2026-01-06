import type { SortOption } from '../types';

interface SortSelectorProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const SortSelector = ({ value, onChange }: SortSelectorProps) => {
  const options = [
    { value: 'delay_desc' as SortOption, label: 'Størst Forsinkelse Først' },
    { value: 'delay_asc' as SortOption, label: 'Minst Forsinkelse Først' },
    { value: 'name_asc' as SortOption, label: 'Stasjonsnavn A-Å' },
    { value: 'name_desc' as SortOption, label: 'Stasjonsnavn Å-A' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label className="font-medium text-gray-700 dark:text-gray-300">Sorter etter:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
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

export default SortSelector;