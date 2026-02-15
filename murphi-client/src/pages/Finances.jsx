import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Wallet, TrendingUp, TrendingDown, Calendar, PieChart, AlertCircle } from 'lucide-react';
import { useFinances } from '../hooks/useFinances';
import { useFormatMoney } from '../hooks/useFormatMoney';
import TransactionList from '../components/finance/TransactionList';
import TransactionForm from '../components/finance/TransactionForm';
import BudgetCard from '../components/finance/BudgetCard';
import { ExpensesByCategory, MonthlyComparison } from '../components/finance/ExpenseChart';
import Sidebar from '../components/common/Sidebar';
import SearchFilter from '../components/common/SearchFilter';

export default function Finances() {
  const {
    transactions,
    budget,
    summary,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    saveBudget
  } = useFinances();
  const { formatMoney } = useFormatMoney();

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(t => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          t.category?.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.amount.toString().includes(search);
        if (!matchesSearch) return false;
      }

      if (filters.type && filters.type !== 'all') {
        if (t.type !== filters.type) return false;
      }

      if (filters.category && filters.category !== 'all') {
        if (t.category !== filters.category) return false;
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (new Date(t.date) < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (new Date(t.date) > toDate) return false;
      }

      if (filters.minAmount) {
        if (t.amount < parseFloat(filters.minAmount)) return false;
      }
      if (filters.maxAmount) {
        if (t.amount > parseFloat(filters.maxAmount)) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, filters]);

  const uniqueCategories = useMemo(() => {
    if (!transactions) return [];
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.map(c => ({ value: c, label: c }));
  }, [transactions]);

  const filterConfig = [
    {
      key: 'type',
      label: 'Tipo',
      options: [
        { value: 'expense', label: 'Gastos' },
        { value: 'income', label: 'Ingresos' }
      ]
    },
    {
      key: 'category',
      label: 'Categoría',
      options: uniqueCategories
    }
  ];

  const handleSubmit = async (data) => {
    try {
      if (editingTransaction) {
        await toast.promise(
          updateTransaction(editingTransaction._id, data),
          {
            loading: 'Actualizando...',
            success: 'Transacción actualizada',
            error: 'Error al actualizar',
          }
        );
      } else {
        await toast.promise(
          addTransaction(data),
          {
            loading: 'Guardando...',
            success: 'Transacción guardada',
            error: 'Error al guardar',
          }
        );
      }
      setShowForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta transacción?')) {
      toast.promise(
        deleteTransaction(id),
        {
          loading: 'Eliminando...',
          success: 'Transacción eliminada',
          error: 'Error al eliminar',
        }
      );
    }
  };

  const totalTransactions = transactions?.length || 0;
  const expenses = transactions?.filter(t => t.type === 'expense') || [];
  const avgExpense = expenses.length > 0
    ? expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length
    : 0;

  const budgetPercentage = budget?.amount > 0
    ? ((summary?.month?.expenses || 0) / budget.amount * 100).toFixed(0)
    : 0;

  const getCurrentMonth = () => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[new Date().getMonth()];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Finanzas</h1>
            <p className="text-sm text-text-secondary flex items-center gap-2 mt-0.5">
              <Calendar size={14} />
              {getCurrentMonth()} {new Date().getFullYear()}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Nueva Transacción
          </button>
        </div>

        {/* Main Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-mint-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-mint-400" />
              </div>
              <span className="text-sm text-text-secondary">Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatMoney(summary?.month?.income)}
            </p>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                <TrendingDown size={20} className="text-danger" />
              </div>
              <span className="text-sm text-text-secondary">Gastos</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatMoney(summary?.month?.expenses)}
            </p>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                (summary?.month?.balance || 0) >= 0 ? 'bg-ocean-500/10' : 'bg-warning/10'
              }`}>
                <Wallet size={20} className={(summary?.month?.balance || 0) >= 0 ? 'text-ocean-400' : 'text-warning'} />
              </div>
              <span className="text-sm text-text-secondary">Balance</span>
            </div>
            <p className={`text-2xl font-bold ${
              (summary?.month?.balance || 0) >= 0 ? 'text-text-primary' : 'text-warning'
            }`}>
              {formatMoney(summary?.month?.balance)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-dark-surface rounded-xl border border-dark-border p-4">
            <div className="text-xs text-text-muted mb-1">Transacciones</div>
            <div className="text-xl font-bold text-text-primary">{totalTransactions}</div>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-4">
            <div className="text-xs text-text-muted mb-1">Promedio</div>
            <div className="text-xl font-bold text-text-primary">{formatMoney(avgExpense)}</div>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-4">
            <div className="text-xs text-text-muted mb-1">Presupuesto</div>
            <div className={`text-xl font-bold ${
              budgetPercentage >= 100 ? 'text-danger' : budgetPercentage >= 80 ? 'text-warning' : 'text-mint-400'
            }`}>
              {budgetPercentage}%
            </div>
          </div>

          <div className="bg-dark-surface rounded-xl border border-dark-border p-4">
            <div className="text-xs text-text-muted mb-1">Ahorro</div>
            <div className="text-xl font-bold text-mint-400">
              {summary?.month?.income > 0
                ? `${(((summary.month.income - summary.month.expenses) / summary.month.income) * 100).toFixed(0)}%`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Budget Alert */}
        {budget?.amount > 0 && budgetPercentage >= 80 && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            budgetPercentage >= 100
              ? 'bg-danger/10 border-danger/30 text-danger'
              : 'bg-warning/10 border-warning/30 text-warning'
          }`}>
            <AlertCircle size={20} />
            <div>
              <div className="font-medium text-sm">
                {budgetPercentage >= 100
                  ? 'Has excedido tu presupuesto'
                  : 'Te acercas al límite'}
              </div>
              <div className="text-xs opacity-80">
                {formatMoney(summary?.month?.expenses)} de {formatMoney(budget.amount)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Transactions */}
          <div className="lg:col-span-2 space-y-4">
            <SearchFilter
              searchPlaceholder="Buscar transacciones..."
              onSearch={setSearchTerm}
              onFilter={setFilters}
              filters={filterConfig}
              activeFilters={filters}
              showDateRange={true}
              showAmountRange={true}
            />

            <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-text-primary">
                  {searchTerm || Object.values(filters).some(v => v && v !== 'all')
                    ? 'Resultados'
                    : 'Transacciones recientes'}
                </h2>
                <span className="text-xs text-text-muted bg-dark-bg px-2 py-1 rounded">
                  {filteredTransactions.length}
                </span>
              </div>
              {filteredTransactions.length > 0 ? (
                <TransactionList
                  transactions={filteredTransactions.slice(0, 15)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : transactions.length > 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No se encontraron transacciones</p>
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Wallet size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay transacciones aún</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Charts & Budget */}
          <div className="space-y-4">
            <BudgetCard
              budget={budget}
              spent={summary?.month?.expenses || 0}
              onSave={saveBudget}
            />

            <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} className="text-ocean-400" />
                <h3 className="font-medium text-text-primary text-sm">Por Categoría</h3>
              </div>
              <ExpensesByCategory data={summary?.month?.expensesByCategory || {}} />
            </div>

            <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
              <h3 className="font-medium text-text-primary text-sm mb-4">Ingresos vs Gastos</h3>
              <MonthlyComparison
                income={summary?.month?.income || 0}
                expenses={summary?.month?.expenses || 0}
              />
            </div>
          </div>
        </div>
      </main>

      {showForm && (
        <TransactionForm
          initialData={editingTransaction}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}
