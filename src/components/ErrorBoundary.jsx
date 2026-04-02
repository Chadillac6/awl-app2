import React from 'react';
import { colors } from '../theme.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ background: colors.offWhite, border: `1px solid ${colors.offWhiteMuted}`, borderRadius: 16, padding: 24 }}>
            <p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 18, marginBottom: 8 }}>Something went wrong</p>
            <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>This section ran into an unexpected error.</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              style={{ background: colors.green, color: colors.offWhite, border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
