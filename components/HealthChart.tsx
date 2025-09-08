'use client';

import React, { useMemo } from 'react';

interface HealthDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface HealthChartProps {
  data: HealthDataPoint[];
  title: string;
  type: 'line' | 'bar' | 'area';
  color?: string;
  unit?: string;
  goal?: number;
  className?: string;
}

export default function HealthChart({
  data,
  title,
  type = 'line',
  color = '#3B82F6',
  unit = '',
  goal,
  className = '',
}: HealthChartProps) {
  const { chartData, stats, dimensions } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartData: [],
        stats: { min: 0, max: 0, avg: 0, latest: 0, trend: 'stable' as const },
        dimensions: { width: 400, height: 200, padding: 40, chartWidth: 320, chartHeight: 120 },
      };
    }

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const values = sortedData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const latest = values[values.length - 1];

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (values.length >= 2) {
      const recent = values.slice(-Math.min(7, values.length)); // Last 7 days or available data
      const older = values.slice(0, Math.min(7, values.length)); // First 7 days or available data
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.05) trend = 'up';
      else if (recentAvg < olderAvg * 0.95) trend = 'down';
    }

    const width = 400;
    const height = 200;
    const padding = 40;

    // Calculate chart dimensions
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Scale data points
    const yRange = max - min || 1;
    const xStep = chartWidth / Math.max(sortedData.length - 1, 1);

    const chartData = sortedData.map((point, index) => ({
      ...point,
      x: padding + index * xStep,
      y: padding + chartHeight - ((point.value - min) / yRange) * chartHeight,
    }));

    return {
      chartData,
      stats: { min, max, avg, latest, trend },
      dimensions: { width, height, padding, chartWidth, chartHeight },
    };
  }, [data]);

  const formatValue = (value: number) => {
    return `${value.toFixed(1)}${unit}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up':
        return <span className="text-green-500">↗️</span>;
      case 'down':
        return <span className="text-red-500">↘️</span>;
      default:
        return <span className="text-gray-500">➡️</span>;
    }
  };

  const renderLineChart = () => {
    if (chartData.length === 0) return null;

    const pathData = chartData
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <g>
        {/* Area fill */}
        {type === 'area' && (
          <path
            d={`${pathData} L ${chartData[chartData.length - 1].x} ${dimensions.height - dimensions.padding} L ${chartData[0].x} ${dimensions.height - dimensions.padding} Z`}
            fill={color}
            fillOpacity={0.1}
          />
        )}
        
        {/* Goal line */}
        {goal && (
          <line
            x1={dimensions.padding}
            y1={dimensions.padding + dimensions.chartHeight - ((goal - stats.min) / (stats.max - stats.min || 1)) * dimensions.chartHeight}
            x2={dimensions.width - dimensions.padding}
            y2={dimensions.padding + dimensions.chartHeight - ((goal - stats.min) / (stats.max - stats.min || 1)) * dimensions.chartHeight}
            stroke="#EF4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {chartData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={color}
            className="hover:r-5 transition-all cursor-pointer"
          >
            <title>{`${formatDate(point.date)}: ${formatValue(point.value)}`}</title>
          </circle>
        ))}
      </g>
    );
  };

  const renderBarChart = () => {
    if (chartData.length === 0) return null;

    const barWidth = Math.max(dimensions.chartWidth / chartData.length - 2, 8);

    return (
      <g>
        {chartData.map((point, index) => (
          <rect
            key={index}
            x={point.x - barWidth / 2}
            y={point.y}
            width={barWidth}
            height={dimensions.height - dimensions.padding - point.y}
            fill={color}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{`${formatDate(point.date)}: ${formatValue(point.value)}`}</title>
          </rect>
        ))}
      </g>
    );
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl font-bold" style={{ color }}>
              {formatValue(stats.latest)}
            </span>
            {getTrendIcon()}
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-600">
          <div>Avg: {formatValue(stats.avg)}</div>
          <div>Range: {formatValue(stats.min)} - {formatValue(stats.max)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        {chartData.length > 0 ? (
          <svg
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-auto"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis */}
            <line
              x1={dimensions.padding}
              y1={dimensions.padding}
              x2={dimensions.padding}
              y2={dimensions.height - dimensions.padding}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            
            {/* X-axis */}
            <line
              x1={dimensions.padding}
              y1={dimensions.height - dimensions.padding}
              x2={dimensions.width - dimensions.padding}
              y2={dimensions.height - dimensions.padding}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            
            {/* Chart content */}
            {type === 'bar' ? renderBarChart() : renderLineChart()}
            
            {/* Y-axis labels */}
            <text
              x={dimensions.padding - 10}
              y={dimensions.padding + 5}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {formatValue(stats.max)}
            </text>
            <text
              x={dimensions.padding - 10}
              y={dimensions.height - dimensions.padding + 5}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {formatValue(stats.min)}
            </text>
            
            {/* X-axis labels */}
            {chartData.length > 0 && (
              <>
                <text
                  x={chartData[0].x}
                  y={dimensions.height - dimensions.padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatDate(chartData[0].date)}
                </text>
                <text
                  x={chartData[chartData.length - 1].x}
                  y={dimensions.height - dimensions.padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatDate(chartData[chartData.length - 1].date)}
                </text>
              </>
            )}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm border-t pt-4">
        <div>
          <div className="font-semibold text-gray-900">{data.length}</div>
          <div className="text-gray-600">Data Points</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">
            {data.length > 0 ? Math.round(((stats.latest - stats.min) / (stats.max - stats.min || 1)) * 100) : 0}%
          </div>
          <div className="text-gray-600">of Range</div>
        </div>
        <div>
          <div className={`font-semibold ${
            stats.trend === 'up' ? 'text-green-600' : 
            stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {stats.trend === 'up' ? 'Improving' : stats.trend === 'down' ? 'Declining' : 'Stable'}
          </div>
          <div className="text-gray-600">Trend</div>
        </div>
      </div>
    </div>
  );
}
