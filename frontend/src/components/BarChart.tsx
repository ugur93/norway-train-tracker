import React from 'react';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, height = 300 }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {title && <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div className="relative" style={{ height }}>
        <div className="flex items-end justify-center space-x-2 h-full">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 max-w-12">
              <div className="w-full flex flex-col items-center mb-2">
                <div
                  className={`w-full rounded-t ${item.color || 'bg-blue-500'} transition-all duration-300 hover:opacity-80`}
                  style={{
                    height: `${(item.value / maxValue) * (height - 60)}px`,
                    minHeight: '4px'
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight max-h-12 overflow-hidden">
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 py-2">
          <span>{maxValue.toFixed(1)}</span>
          <span>{(maxValue * 0.75).toFixed(1)}</span>
          <span>{(maxValue * 0.5).toFixed(1)}</span>
          <span>{(maxValue * 0.25).toFixed(1)}</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
};

export default BarChart;