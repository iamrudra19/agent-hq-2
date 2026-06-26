import { Component, ReactNode } from "react";

interface State { hasError: boolean; error: Error | null }
interface Props { children: ReactNode }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center">
            <span className="text-danger text-2xl font-bold">!</span>
          </div>
          <p className="font-display font-bold text-white text-lg">Page error</p>
          <p className="text-white/40 text-sm max-w-sm text-center leading-relaxed">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
