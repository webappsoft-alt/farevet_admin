import React from "react";

/** Catches render errors so one broken component shows a message instead of a blank page. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Render error:", error, info?.componentStack);
  }

  handleLogout = () => {
    window.localStorage.removeItem("isLogin_farevet_admin");
    window.localStorage.removeItem("login_farevet_formData");
    window.localStorage.removeItem("user_type");
    window.location.hash = "#/login";
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="h-screen flex flex-col justify-center items-center gap-3 px-4 text-center">
        <h1 className="text-lg font-semibold">Something went wrong loading this page.</h1>
        <p className="text-sm text-gray-500">
          Try reloading. If it keeps happening, log out and log back in.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-[#8930f9] text-white"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={this.handleLogout}
          >
            Log out
          </button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
