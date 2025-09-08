'use client';

import React, { useMemo } from 'react';

interface ChartDataPoint {
  month_year: string;
  month_date: string;
  total_income?: number;
  total_expenses?: number;
  net_cash_flow?: number;
  budget_amount?: number;
  spent_amount?: number;
}

interface FinanceLineChartProps {
  data: ChartDataPoint[];
  title: string;
  type: 'cash_flow' | 'budget_vs_spending';
  className?: string;
}

export default function FinanceLineChart({ 
  data, 
  title, 
  type,
  className = '' 
}: FinanceLineChartProps) {
  const { chartData, stats, dimensions } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartData: [],
        stats: { min: 0, max: 0, avg: 0, trend: 'stable' as const },
        dimensions: { width: 600, height: 300, padding: 60, chartWidth: 480, chartHeight: 180 },
      };
    }

    const sortedData = [...data].sort((a, b) => new Date(a.month_date).getTime() - new Date(b.month_date).getTime());
    
    const width = 600;
    const height = 300;
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    let values: number[] = [];
    let secondaryValues: number[] = [];

    if (type === 'cash_flow') {
      values = sortedData.map(d => d.net_cash_flow || 0);
      secondaryValues = sortedData.map(d => d.total_income || 0);
    } else {
      values = sortedData.map(d => d.spent_amount || 0);
      secondaryValues = sortedData.map(d => d.budget_amount || 0);
    }

    const allValues = [...values, ...secondaryValues];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (values.length >= 2) {
      const recent = values.slice(-3);
      const older = values.slice(0, 3);
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.1) trend = 'up';
      else if (recentAvg < olderAvg * 0.9) trend = 'down';
    }

    const yRange = max - min || 1;
    const xStep = chartWidth / Math.max(sortedData.length - 1, 1);

    const chartData = sortedData.map((point, index) => {
      const primaryValue = type === 'cash_flow' ? (point.net_cash_flow || 0) : (point.spent_amount || 0);
      const secondaryValue = type === 'cash_flow' ? (point.total_income || 0) : (point.budget_amount || 0);

      return {
        ...point,
        x: padding + index * xStep,
        primaryY: padding + chartHeight - ((primaryValue - min) / yRange) * chartHeight,
        secondaryY: padding + chartHeight - ((secondaryValue - min) / yRange) * chartHeight,
        primaryValue,
        secondaryValue,
      };
    });

    return {
      chartData,
      stats: { min, max, avg, trend },
      dimensions: { width, height, padding, chartWidth, chartHeight },
    };
  }, [data, type]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
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

  const getColors = () => {
    if (type === 'cash_flow') {
      return {
        primary: '#10B981', // Green for net cash flow
        secondary: '#3B82F6', // Blue for income
        primaryLabel: 'Net Cash Flow',
        secondaryLabel: 'Income',
      };
    } else {
      return {
        primary: '#EF4444', // Red for spending
        secondary: '#6B7280', // Gray for budget
        primaryLabel: 'Spending',
        secondaryLabel: 'Budget',
      };
    }
  };

  const colors = getColors();

  const renderLines = () => {
    if (chartData.length === 0) return null;

    // Primary line path
    const primaryPath = chartData
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.primaryY}`)
      .join(' ');

    // Secondary line path
    const secondaryPath = chartData
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.secondaryY}`)
      .join(' ');

    return (
      <g>
        {/* Secondary line (budget/income) */}
        <path
          d={secondaryPath}
          fill="none"
          stroke={colors.secondary}
          strokeWidth={2}
          strokeDasharray="5,5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Primary line (spending/net cash flow) */}
        <path
          d={primaryPath}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {chartData.map((point, index) => (
          <g key={index}>
            {/* Secondary points */}
            <circle
              cx={point.x}
              cy={point.secondaryY}
              r={4}
              fill={colors.secondary}
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>{`${point.month_year}: ${colors.secondaryLabel} ${formatCurrency(point.secondaryValue)}`}</title>
            </circle>
            
            {/* Primary points */}
            <circle
              cx={point.x}
              cy={point.primaryY}
              r={5}
              fill={colors.primary}
              className="hover:r-7 transition-all cursor-pointer"
            >
              <title>{`${point.month_year}: ${colors.primaryLabel} ${formatCurrency(point.primaryValue)}`}</title>
            </circle>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl font-bold" style={{ color: colors.primary }}>
              {formatCurrency(stats.avg)}
            </span>
            <span className="text-sm text-gray-600">avg</span>
            {getTrendIcon()}
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-600">
          <div>Range: {formatCurrency(stats.min)} - {formatCurrency(stats.max)}</div>
          <div>{data.length} months</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
          <span className="text-sm text-gray-600">{colors.primaryLabel}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-dashed rounded-full" style={{ borderColor: colors.secondary }} />
          <span className="text-sm text-gray-600">{colors.secondaryLabel}</span>
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
            
            {/* Zero line for cash flow */}
            {type === 'cash_flow' && stats.min < 0 && (
              <line
                x1={dimensions.padding}
                y1={dimensions.padding + dimensions.chartHeight - ((-stats.min) / (stats.max - stats.min)) * dimensions.chartHeight}
                x2={dimensions.width - dimensions.padding}
                y2={dimensions.padding + dimensions.chartHeight - ((-stats.min) / (stats.max - stats.min)) * dimensions.chartHeight}
                stroke="#DC2626"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            )}
            
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
            
            {/* Chart lines */}
            {renderLines()}
            
            {/* Y-axis labels */}
            <text
              x={dimensions.padding - 10}
              y={dimensions.padding + 5}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {formatCurrency(stats.max)}
            </text>
            <text
              x={dimensions.padding - 10}
              y={dimensions.height - dimensions.padding + 5}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {formatCurrency(stats.min)}
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
                  {formatDate(chartData[0].month_date)}
                </text>
                <text
                  x={chartData[chartData.length - 1].x}
                  y={dimensions.height - dimensions.padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatDate(chartData[chartData.length - 1].month_date)}
                </text>
              </>
            )}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p>No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm border-t pt-4">
        <div>
          <div className="font-semibold text-gray-900">{data.length}</div>
          <div className="text-gray-600">Months</div>
        </div>
        <div>
          <div className={`font-semibold ${
            stats.trend === 'up' ? 'text-green-600' : 
            stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}
          </div>
          <div className="text-gray-600">Trend</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(Math.abs(stats.max - stats.min))}
          </div>
          <div className="text-gray-600">Range</div>
        </div>
      </div>
    </div>
  );
}
