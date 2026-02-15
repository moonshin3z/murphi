import { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, Tag } from 'lucide-react';

export default function SearchFilter({
  searchPlaceholder = 'Buscar...',
  onSearch,
  onFilter,
  filters = [],
  activeFilters = {},
  showDateRange = false,
  showAmountRange = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilter?.(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    setSearchTerm('');
    onFilter?.({});
    onSearch?.('');
  };

  const hasActiveFilters = Object.values(localFilters).some(v => v && v !== 'all') || searchTerm;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-lg border flex items-center gap-2 transition text-sm ${
            showFilters || hasActiveFilters
              ? 'border-mint-500/30 bg-mint-500/10 text-mint-400'
              : 'border-dark-border bg-dark-surface text-text-secondary hover:bg-dark-elevated'
          }`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="bg-mint-500 text-dark-bg text-xs px-1.5 py-0.5 rounded font-medium">
              {Object.values(localFilters).filter(v => v && v !== 'all').length + (searchTerm ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-text-primary text-sm flex items-center gap-2">
              <Filter size={14} />
              Filtros
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-danger hover:text-danger-light flex items-center gap-1"
              >
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Dynamic filters */}
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs text-text-muted mb-1.5">
                  {filter.label}
                </label>
                <select
                  value={localFilters[filter.key] || 'all'}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="input text-sm py-2"
                >
                  <option value="all">Todos</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Date Range */}
            {showDateRange && (
              <>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">
                    <Calendar size={12} className="inline mr-1" />
                    Desde
                  </label>
                  <input
                    type="date"
                    value={localFilters.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="input text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">
                    <Calendar size={12} className="inline mr-1" />
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={localFilters.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="input text-sm py-2"
                  />
                </div>
              </>
            )}

            {/* Amount Range */}
            {showAmountRange && (
              <>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">
                    <DollarSign size={12} className="inline mr-1" />
                    Monto mín.
                  </label>
                  <input
                    type="number"
                    value={localFilters.minAmount || ''}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    placeholder="$0"
                    className="input text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">
                    <DollarSign size={12} className="inline mr-1" />
                    Monto máx.
                  </label>
                  <input
                    type="number"
                    value={localFilters.maxAmount || ''}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    placeholder="$10,000"
                    className="input text-sm py-2"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-mint-500/10 text-mint-400 rounded-lg text-xs">
              <Search size={12} />
              "{searchTerm}"
              <button onClick={() => handleSearch('')} className="hover:text-mint-300 ml-1">
                <X size={12} />
              </button>
            </span>
          )}
          {Object.entries(localFilters).map(([key, value]) => {
            if (!value || value === 'all') return null;
            const filter = filters.find(f => f.key === key);
            const option = filter?.options.find(o => o.value === value);
            return (
              <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-dark-elevated text-text-secondary rounded-lg text-xs">
                <Tag size={12} />
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => handleFilterChange(key, 'all')}
                  className="hover:text-text-primary ml-1"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
