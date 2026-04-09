import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[Taskiner] Uncaught error:", error, info.componentStack);
    }
  }

  private retry = () => this.setState({ hasError: false, error: null });

  private wipeAndReload = () => {
    try {
      [
        "taskiner-tasks",
        "taskiner-ui",
        "taskiner-categories",
        "taskiner-focus-sessions",
        "taskiner-habits",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {
      // storage unavailable — proceed with reload anyway
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary__icon">⚠️</div>
        <h1 className="error-boundary__title">Coś poszło nie tak</h1>
        <p className="error-boundary__desc">
          Aplikacja napotkała nieoczekiwany błąd. Spróbuj ponownie lub wyczyść dane aplikacji.
        </p>

        {this.state.error && (
          <details className="error-boundary__details">
            <summary>Szczegóły błędu</summary>
            <code>{this.state.error.message}</code>
          </details>
        )}

        <button className="error-boundary__btn error-boundary__btn--primary" onClick={this.retry}>
          Spróbuj ponownie
        </button>
        <button className="error-boundary__btn error-boundary__btn--secondary" onClick={this.wipeAndReload}>
          Wyczyść dane i uruchom ponownie
        </button>
      </div>
    );
  }
}
