'use client';

import React, { useMemo } from 'react';

interface CategoryData {
  category_id: string;
  category_name: string;
  category_color: string;
  total_amount: number;
  transaction_count: number;
}

interface FinancePieChartProps {
  data: CategoryData[];
  title: string;
  total?: number;
  className?: string;
}

export default function FinancePieChart({ 
  data, 
  title, 
  total: providedTotal,
  className = '' 
}: FinancePieChartProps) {
  const { chartData, total, centerX, centerY, radius } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], total: 0, centerX: 150, centerY: 150, radius: 100 };
    }

    const total = providedTotal || data.reduce((sum, item) => sum + item.total_amount, 0);
    const centerX = 150;
    const centerY = 150;
    const radius = 100;

    let currentAngle = -90; // Start from top

    const chartData = data.map((item) => {
      const percentage = total > 0 ? (item.total_amount / total) * 100 : 0;
      const angle = (item.total_amount / total) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Calculate path for the slice
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      currentAngle += angle;

      return {
        ...item,
        percentage,
        angle,
        pathData,
        startAngle,
        endAngle,
      };
    });

    return { chartData, total, centerX, centerY, radius };
  }, [data, providedTotal]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>{data.length} categories</div>
          <div>{data.reduce((sum, item) => sum + item.transaction_count, 0)} transactions</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <svg width="300" height="300" className="drop-shadow-sm">
            {/* Chart slices */}
            {chartData.map((slice, index) => (
              <g key={slice.category_id || index}>
                <path
                  d={slice.pathData}
                  fill={slice.category_color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>
                    {slice.category_name}: {formatCurrency(slice.total_amount)} ({formatPercentage(slice.percentage)})
                  </title>
                </path>
              </g>
            ))}
            
            {/* Center circle for donut effect */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.4}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            
            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-600"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-lg font-bold fill-gray-900"
            >
              {formatCurrency(total)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {chartData.map((slice, index) => (
              <div key={slice.category_id || index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: slice.category_color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {slice.category_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {slice.transaction_count} transaction{slice.transaction_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(slice.total_amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPercentage(slice.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Largest Category</div>
                <div className="font-medium text-gray-900">
                  {chartData[0]?.category_name || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Average per Category</div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(total / chartData.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
