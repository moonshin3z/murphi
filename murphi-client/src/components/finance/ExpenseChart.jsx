import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, Wallet } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { useFormatMoney } from '../../hooks/useFormatMoney';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Updated color palette to match our theme
const COLORS = [
  '#3FB68B', // mint
  '#58A6FF', // ocean
  '#F59E0B', // amber
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
  '#EF4444', // red
];

export function ExpensesByCategory({ data }) {
  const { formatMoney } = useFormatMoney();
  const categories = Object.keys(data);
  const values = Object.values(data);
  const total = values.reduce((sum, val) => sum + val, 0);

  const chartData = {
    labels: categories,
    datasets: [{
      data: values,
      backgroundColor: COLORS.slice(0, categories.length),
      borderWidth: 2,
      borderColor: '#161B22',
      hoverOffset: 8,
      hoverBorderWidth: 3
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#21262D',
        titleColor: '#E6EDF3',
        bodyColor: '#8B949E',
        borderColor: '#30363D',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: '600',
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${formatMoney(value)} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutQuart'
    }
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-text-muted">
        <div className="w-10 h-10 rounded-lg bg-dark-elevated flex items-center justify-center mb-2">
          <PieChart size={20} />
        </div>
        <p className="text-sm">Sin gastos registrados</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="w-full max-w-[180px] mx-auto">
        <Doughnut data={chartData} options={options} />
        {total > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wide">Total</div>
            <div className="text-sm font-bold text-text-primary">{formatMoney(total)}</div>
          </div>
        )}
      </div>

      {/* Custom legend */}
      <div className="mt-4 space-y-1.5">
        {categories.map((cat, i) => {
          const value = values[i];
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return (
            <div key={cat} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-text-secondary truncate">{cat}</span>
              </div>
              <span className="text-text-muted ml-2">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MonthlyComparison({ income, expenses }) {
  const { formatMoney } = useFormatMoney();
  const balance = income - expenses;

  const chartData = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [
      {
        label: 'Monto',
        data: [income, expenses],
        backgroundColor: [
          'rgba(63, 182, 139, 0.8)',  // mint for income
          'rgba(248, 81, 73, 0.8)',   // danger for expenses
        ],
        borderColor: [
          '#3FB68B',
          '#F85149',
        ],
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 32
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#21262D',
        titleColor: '#E6EDF3',
        bodyColor: '#8B949E',
        borderColor: '#30363D',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => formatMoney(context.parsed.x)
        }
      }
    },
    scales: {
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#8B949E',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(48, 54, 61, 0.5)',
          drawBorder: false
        },
        ticks: {
          color: '#484F58',
          font: {
            size: 10,
            family: "'Inter', sans-serif"
          },
          callback: (value) => {
            if (value >= 1000) {
              return `$${(value / 1000).toFixed(0)}k`;
            }
            return `$${value}`;
          }
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    }
  };

  if (income === 0 && expenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-text-muted">
        <div className="w-10 h-10 rounded-lg bg-dark-elevated flex items-center justify-center mb-2">
          <Wallet size={20} />
        </div>
        <p className="text-sm">Sin movimientos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-24">
        <Bar data={chartData} options={options} />
      </div>

      {/* Balance summary */}
      <div className={`mt-4 p-3 rounded-lg border ${
        balance >= 0
          ? 'bg-mint-500/10 border-mint-500/20'
          : 'bg-warning/10 border-warning/20'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${balance >= 0 ? 'text-mint-400' : 'text-warning'}`}>
            {balance >= 0 ? 'Balance positivo' : 'Balance negativo'}
          </span>
          <span className={`text-sm font-bold ${balance >= 0 ? 'text-mint-400' : 'text-warning'}`}>
            {balance >= 0 ? '+' : ''}{formatMoney(balance)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BudgetProgress({ used, total, threshold }) {
  const { formatMoney } = useFormatMoney();
  const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const isWarning = percentage >= threshold;
  const isOver = percentage >= 100;

  const getColorClass = () => {
    if (isOver) return 'danger';
    if (isWarning) return 'warning';
    return 'mint';
  };

  const color = getColorClass();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">Usado</span>
        <span className={`text-sm font-semibold ${
          isOver ? 'text-danger' : isWarning ? 'text-warning' : 'text-mint-400'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-mint-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-text-muted">
        <span>{formatMoney(used)}</span>
        <span>{formatMoney(total)}</span>
      </div>

      {/* Remaining budget */}
      {total > used && (
        <div className="pt-2 border-t border-dark-border">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Disponible</span>
            <span className="text-sm font-medium text-text-primary">
              {formatMoney(total - used)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
