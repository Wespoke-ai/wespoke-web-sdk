import React from 'react';
import '../styles/FloatingButton.css';

export interface FloatingButtonProps {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  isOpen: boolean;
  isActive: boolean;
  primaryColor: string;
  accentColor: string;
  onClick: () => void;
  badgeCount?: number;
  buttonText?: string;
  mode?: 'voice' | 'chat' | 'hybrid';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  position,
  isOpen,
  isActive,
  primaryColor,
  accentColor,
  onClick,
  badgeCount = 0,
  buttonText = 'Asistan ile Konuş',
  mode = 'voice'
}) => {
  const positionClass = `wespoke-fab-${position}`;
  const stateClass = isOpen ? 'wespoke-fab-open' : '';
  const activeClass = isActive ? 'wespoke-fab-active' : '';

  // Use buttonBaseColor from CSS var if available, otherwise fall back to primaryColor
  const buttonBaseColor = getComputedStyle(document.documentElement).getPropertyValue('--wespoke-button-base-color').trim();
  const useCustomButtonColors = !!buttonBaseColor;

  return (
    <button
      className={`wespoke-fab ${positionClass} ${stateClass} ${activeClass}`}
      onClick={onClick}
      aria-label={isOpen ? 'Asistanı Kapat' : buttonText}
      title={isOpen ? 'Asistanı Kapat' : buttonText}
      style={{
        backgroundColor: useCustomButtonColors ? `var(--wespoke-button-base-color)` : primaryColor,
        borderColor: accentColor
      }}
    >
      {/* Badge for notifications */}
      {badgeCount > 0 && !isOpen && (
        <span
          className="wespoke-fab-badge"
          style={{ backgroundColor: accentColor }}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}

      {/* Icon - changes based on state */}
      <div className="wespoke-fab-icon">
        {isOpen ? (
          // Close icon (X) - shown when widget is open
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : mode === 'chat' ? (
          // Message bubble icon (for chat mode)
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          // Microphone icon (for voice mode or hybrid)
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </div>

      {/* Active pulse animation */}
      {isActive && !isOpen && (
        <div
          className="wespoke-fab-pulse"
          style={{ borderColor: accentColor }}
        />
      )}
    </button>
  );
};
