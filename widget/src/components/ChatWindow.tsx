import React, { ReactNode } from 'react';
import { WidgetSize, WidgetPosition } from '../types';
import '../styles/ChatWindow.css';

export interface ChatWindowProps {
  isOpen: boolean;
  size: WidgetSize;
  position: WidgetPosition;
  primaryColor: string;
  accentColor: string;
  welcomeMessage?: string;
  children: ReactNode;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  size,
  position,
  primaryColor,
  accentColor,
  welcomeMessage,
  children,
  onClose
}) => {
  if (!isOpen) return null;

  const sizeClass = `wespoke-chat-${size}`;
  const positionClass = `wespoke-chat-${position}`;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="wespoke-chat-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Chat Window */}
      <div
        className={`wespoke-chat-window ${sizeClass} ${positionClass}`}
        role="dialog"
        aria-label="Chat AI Asistanı"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className="wespoke-chat-header"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
          }}
        >
          <div className="wespoke-chat-header-content">
            <div className="wespoke-chat-header-icon">
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
            </div>
            <div className="wespoke-chat-header-text">
              <h3 className="wespoke-chat-title">AI Asistan</h3>
              <p className="wespoke-chat-subtitle">Sizinle konuşmaya hazır</p>
            </div>
          </div>

          {/* Close button */}
          <button
            className="wespoke-chat-close"
            onClick={onClose}
            aria-label="Sohbeti Kapat"
            title="Sohbeti Kapat"
          >
            <svg
              width="20"
              height="20"
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
          </button>
        </div>

        {/* Welcome Message */}
        {welcomeMessage && (
          <div className="wespoke-chat-welcome">
            <div className="wespoke-chat-welcome-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 12l9.09-5.26" />
              </svg>
            </div>
            <p className="wespoke-chat-welcome-text">{welcomeMessage}</p>
          </div>
        )}

        {/* Content Area - Children (Transcript + VoiceControls) */}
        <div className="wespoke-chat-content">
          {children}
        </div>

        {/* Powered by Wespoke */}
        <div className="wespoke-chat-footer">
          <a
            href="https://wespoke.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="wespoke-chat-branding"
          >
            Powered by <strong>Wespoke</strong>
          </a>
        </div>
      </div>
    </>
  );
};
