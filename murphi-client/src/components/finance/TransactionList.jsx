import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Edit2, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useFormatMoney } from '../../hooks/useFormatMoney';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  const { formatMoney } = useFormatMoney();
  const [openMenu, setOpenMenu] = useState(null);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No hay transacciones registradas
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction._id}
          className="flex items-center justify-between p-3.5 bg-dark-bg rounded-lg border border-dark-border hover:border-dark-hover transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              transaction.type === 'income'
                ? 'bg-mint-500/10'
                : 'bg-danger/10'
            }`}>
              {transaction.type === 'income' ? (
                <TrendingUp size={16} className="text-mint-400" />
              ) : (
                <TrendingDown size={16} className="text-danger" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-text-primary text-sm truncate">
                  {transaction.category}
                </p>
                {transaction.isFixed && (
                  <span className="text-[10px] bg-ocean-500/15 text-ocean-400 px-1.5 py-0.5 rounded flex-shrink-0">
                    Fijo
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted truncate">
                {transaction.description || format(new Date(transaction.date), 'd MMM', { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-semibold text-sm ${
              transaction.type === 'income' ? 'text-mint-400' : 'text-danger'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
            </span>

            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === transaction._id ? null : transaction._id)}
                className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal size={16} />
              </button>

              {openMenu === transaction._id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenMenu(null)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-dark-elevated border border-dark-border rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                    <button
                      onClick={() => {
                        onEdit(transaction);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-dark-hover hover:text-text-primary transition"
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDelete(transaction._id);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
