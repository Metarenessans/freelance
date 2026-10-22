'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Props {
  children: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  measuredWidth: number | null;
  measuredHeight: number | null;
}

export class MicroErrorBoundary extends Component<Props, State> {
  private wrapperRef = React.createRef<HTMLDivElement>();
  private resizeObserver: ResizeObserver | null = null;
  // Debounce timer: delay setState by 300 ms.
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Update the last stable dimensions before the error state changes.
  // Use those dimensions when rendering the fallback.
  private lastKnownWidth: number = 0;
  private lastKnownHeight: number = 0;

  public state: State = {
    hasError: false,
    error: null,
    measuredWidth: null,
    measuredHeight: null,
  };

  // React calls this before componentDidCatch and render.
  // Use the last known dimensions already recorded by ResizeObserver.
  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidMount() {
    this.attachObserver();
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    // Reconnect the observer only after recovering from an error.
    // During normal operation the observer stays attached
    // for the entire lifetime of the component.
    if (prevState.hasError && !this.state.hasError) {
      this.attachObserver();
    }
  }

  public componentWillUnmount() {
    this.detachObserver();
  }

  // ResizeObserver lifecycle.

  private attachObserver = () => {
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) return;
    if (this.resizeObserver) return; // Already connected.

    const element =
      this.wrapperRef.current?.firstElementChild ??
      this.wrapperRef.current;

    if (!element) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      // Unlike getBoundingClientRect(), contentRect does not force layout reflow.
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      // Update the primitive cache immediately without rendering.
      this.lastKnownWidth = w;
      this.lastKnownHeight = h;

      // Debounce state updates by 300 ms.
      // Cancel the previous timer if resizing continues.
      if (this.resizeDebounceTimer !== null) {
        clearTimeout(this.resizeDebounceTimer);
      }
      this.resizeDebounceTimer = setTimeout(() => {
        this.resizeDebounceTimer = null;
        // Save state only while the component has not failed,
        // avoiding unnecessary normal-mode renders.
        if (!this.state.hasError) {
          this.setState({ measuredWidth: w, measuredHeight: h });
        }
      }, 300);
    });

    this.resizeObserver.observe(element);
  };

  private detachObserver = () => {
    if (this.resizeDebounceTimer !== null) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  };

  // Event handlers.

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Stop observing immediately; dimensions are already stored in lastKnown.
    this.detachObserver();
    console.error(`[ErrorBoundary] Component failed "${this.props.name}":`, error, errorInfo);
  }

  private handleCopyError = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.error) {
      const errorText = [
        '[Catering Error Log]',
        `Component: ${this.props.name}`,
        `Message: ${this.state.error.message}`,
        `Stack:\n${this.state.error.stack ?? 'unavailable'}`,
      ].join('\n');

      navigator.clipboard
        .writeText(errorText)
        .then(() => {
          toast.success('Error report copied to clipboard!', {
            icon: '📋',
            style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255, 59, 48, 0.2)' },
          });
        })
        .catch(() => toast.error('Could not copy the error report.'));
    }
  };

  // Rendering.

  public render() {
    if (this.state.hasError) {
      // Use lastKnownWidth and lastKnownHeight, updated immediately
      // by ResizeObserver before the component fails.
      const w = this.lastKnownWidth;
      const h = this.lastKnownHeight;

      const fallbackStyle: React.CSSProperties = {
        width: w > 0 ? `${w}px` : '100%',
        height: h > 0 ? `${h}px` : 'auto',
        minHeight: h > 0 ? undefined : '42px',
        boxSizing: 'border-box',
      };

      return (
        <div
          className="flex items-center justify-between bg-red-950/5 border border-red-500/20 rounded-[14px] px-4 text-red-500 text-sm font-medium transition-all overflow-hidden"
          style={fallbackStyle}
        >
          <div className="flex items-center gap-2 select-none opacity-80 overflow-hidden">
            <span className="text-sm shrink-0">⚠️</span>
            <span className="text-[12px] md:text-sm font-normal text-red-400 truncate">
              Oops, something went wrong
            </span>
          </div>

          <button
            onClick={this.handleCopyError}
            title="Copy error details for support"
            className="flex items-center justify-center p-1.5 rounded-lg hover:bg-red-500/10 active:scale-95 text-red-400 hover:text-red-300 transition-all cursor-pointer border-0 bg-transparent shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ width: '18px', height: '18px' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          </button>
        </div>
      );
    }

    // A display: contents wrapper does not affect CSS Grid or Flexbox layout.
    return (
      <div ref={this.wrapperRef} style={{ display: 'contents' }}>
        {this.props.children}
      </div>
    );
  }
}
