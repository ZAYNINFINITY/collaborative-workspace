import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg space-y-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-white/70">The workspace UI hit an unexpected error. Please retry.</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
