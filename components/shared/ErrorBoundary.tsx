"use client";

import type { ReactNode } from "react";
import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10 bg-slate-50">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B2A4A] text-white">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
              <p className="mt-1 text-sm text-slate-600">Your complaint is safe.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

