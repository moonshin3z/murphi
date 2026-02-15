import { useState } from 'react';
import { X, TrendingDown, TrendingUp } from 'lucide-react';

const CATEGORIES = {
  expense: ['Renta', 'Comida', 'Transporte', 'Servicios', 'Internet', 'Ocio', 'Salud', 'Educación', 'Otros'],
  income: ['Beca', 'Trabajo', 'Familia', 'Freelance', 'Otros']
};

export default function TransactionForm({ onSubmit, onClose, initialData }) {
  const [form, setForm] = useState(initialData || {
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isFixed: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount: parseFloat(form.amount)
    });
  };

  return (
    <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border p-6 w-full max-w-md animate-scaleIn">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-text-primary">
            {initialData ? 'Editar' : 'Nueva'} Transacción
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'expense', category: '' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                form.type === 'expense'
                  ? 'bg-danger/15 text-danger border border-danger/30'
                  : 'bg-dark-elevated text-text-muted border border-dark-border hover:border-dark-hover'
              }`}
            >
              <TrendingDown size={16} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'income', category: '' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                form.type === 'income'
                  ? 'bg-mint-500/15 text-mint-400 border border-mint-500/30'
                  : 'bg-dark-elevated text-text-muted border border-dark-border hover:border-dark-hover'
              }`}
            >
              <TrendingUp size={16} />
              Ingreso
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Categoría
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Seleccionar...</option>
              {CATEGORIES[form.type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Monto
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input w-full"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Descripción <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full"
              placeholder="Ej: Almuerzo con amigos"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* Fixed expense checkbox */}
          <label className="flex items-center gap-3 py-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isFixed}
                onChange={(e) => setForm({ ...form, isFixed: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border-2 border-dark-border bg-dark-bg peer-checked:bg-ocean-500 peer-checked:border-ocean-500 transition-all"></div>
              <svg
                className="absolute top-0.5 left-0.5 w-4 h-4 text-dark-bg opacity-0 peer-checked:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              Es gasto fijo (se repite cada mes)
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
          >
            {initialData ? 'Guardar Cambios' : 'Agregar Transacción'}
          </button>
        </form>
      </div>
    </div>
  );
}
