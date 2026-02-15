export default function LoadingSpinner({ size = 'medium', message }) {
  const sizes = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizes[size]} rounded-full border-4 border-dark-border`}></div>

        {/* Animated ring */}
        <div className={`${sizes[size]} rounded-full border-4 border-mint-500 border-t-transparent animate-spin absolute top-0 left-0`}></div>

        {/* Inner pulsing dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-mint-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {message && (
        <p className="text-text-secondary text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}

export function LoadingPage({ message = 'Cargando...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="mt-6 text-text-secondary font-medium">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-dark-surface rounded-xl p-8 border border-dark-border animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-dark-elevated rounded w-3/4"></div>
        <div className="h-4 bg-dark-elevated rounded w-1/2"></div>
        <div className="h-4 bg-dark-elevated rounded w-5/6"></div>
      </div>
    </div>
  );
}
