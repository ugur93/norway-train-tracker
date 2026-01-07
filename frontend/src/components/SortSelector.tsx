import type { SortOption } from '../types';

interface SortSelectorProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const SortSelector = ({ value, onChange }: SortSelectorProps) => {
  const options = [
    { value: 'delay_desc' as SortOption, label: 'Mest forsinket' },
    { value: 'delay_asc' as SortOption, label: 'Minst forsinket' },
    { value: 'name_asc' as SortOption, label: 'Navn A-Å' },
    { value: 'name_desc' as SortOption, label: 'Navn Å-A' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
      <label className="font-medium text-gray-700 text-sm">Sorter:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
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

export default SortSelector;