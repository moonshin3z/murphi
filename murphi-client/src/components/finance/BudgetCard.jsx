import { useState } from 'react';
import { Settings, X, Target } from 'lucide-react';
import { BudgetProgress } from './ExpenseChart';

export default function BudgetCard({ budget, spent, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(budget?.amount || 0);
  const [threshold, setThreshold] = useState(budget?.alertThreshold || 80);

  const handleSave = () => {
    onSave({ amount: parseFloat(amount), alertThreshold: parseInt(threshold) });
    setIsEditing(false);
  };

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-ocean-400" />
          <h3 className="font-medium text-text-primary text-sm">Presupuesto Mensual</h3>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      {budget?.amount > 0 ? (
        <BudgetProgress
          used={spent}
          total={budget.amount}
          threshold={budget.alertThreshold}
        />
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-dark-elevated flex items-center justify-center mx-auto mb-3">
            <Target size={24} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-muted mb-3">No has configurado un presupuesto</p>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-ocean-400 hover:text-ocean-300 font-medium transition-colors"
          >
            Configurar ahora
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface rounded-xl border border-dark-border p-6 w-full max-w-sm animate-scaleIn">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-text-primary">Configurar Presupuesto</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Presupuesto mensual
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input w-full"
                  placeholder="10000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Alertar al llegar a (%)
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="input w-full"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Recibirás una alerta cuando alcances este porcentaje
                </p>
              </div>

              <button
                onClick={handleSave}
                className="btn btn-primary w-full mt-2"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
