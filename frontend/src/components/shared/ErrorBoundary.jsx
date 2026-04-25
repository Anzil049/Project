import React from 'react';
import { AlertCircle, RotateCcw, Activity } from 'lucide-react';
import { Button } from '../common';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md space-y-8">
            <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-red-50 flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                    <Activity size={48} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-navy tracking-tight">Technical Discrepancy</h2>
                    <p className="text-sm text-navy/40 font-bold max-w-xs">{this.state.error?.message || "An unexpected error occurred in the synchronization layer."}</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-navy/90 transition-all shadow-xl shadow-navy/10"
                >
                    Re-Synchronize System
                </button>
            </div>
        </div>
    </div>  );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
