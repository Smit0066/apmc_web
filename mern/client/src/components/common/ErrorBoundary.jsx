import { Component } from 'react';
import { logger } from '../../utils/logger.js';

/** Logs unexpected render errors. The fallback only renders after a crash (previously a blank page). */
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { logger.error('Unhandled UI error', { message: error.message, componentStack: info.componentStack }); }
  render() {
    if (this.state.failed) return <div role="alert" style={{ padding: 24 }}>Something went wrong. Please reload the page.</div>;
    return this.props.children;
  }
}
