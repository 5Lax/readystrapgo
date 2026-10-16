"use client";
import { Component, type ReactNode } from "react";

export class CustomizerErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="cz-notice" role="alert">
          <strong>This view could not be drawn.</strong>
          <p>Your selections are still available. Try resetting this view.</p>
          <button
            type="button"
            onClick={() => {
              this.props.onReset?.();
              this.setState({ failed: false });
            }}
          >
            Try again
          </button>
        </div>
      );
    return this.props.children;
  }
}
