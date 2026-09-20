import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="neo-card max-w-lg w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl neo-card flex items-center justify-center text-rose-500 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Something went wrong
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                An unexpected interface error occurred. Our team has been notified. You can reload the page or navigate safely back to the home screen.
              </p>
            </div>

            {/* Development error message preview */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="p-3 bg-rose-50/60 border border-rose-200/60 rounded-xl text-left text-xs font-mono text-rose-700 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="neo-btn-primary px-5 py-2.5 rounded-xl font-medium inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="neo-btn-secondary px-5 py-2.5 rounded-xl font-medium inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
