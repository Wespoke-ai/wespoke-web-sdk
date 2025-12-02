import React from 'react';
import { WidgetState } from '../types';
import '../styles/VoiceControls.css';

export interface VoiceControlsProps {
  state: WidgetState;
  isMuted: boolean;
  primaryColor: string;
  accentColor: string;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  requireConsent?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  state,
  isMuted,
  primaryColor,
  accentColor,
  onStartCall,
  onEndCall,
  onToggleMute,
  requireConsent = true
}) => {
  const isConnecting = state === 'connecting';
  const isConnected = state === 'connected';
  const isIdle = state === 'idle';

  return (
    <div className="wespoke-voice-controls">
      {/* Connection Status Indicator */}
      <div className="wespoke-voice-status">
        {isIdle && (
          <div className="wespoke-status-indicator wespoke-status-idle">
            <div className="wespoke-status-dot" />
            <span>Bağlantı bekleniyor</span>
          </div>
        )}

        {isConnecting && (
          <div className="wespoke-status-indicator wespoke-status-connecting">
            <div className="wespoke-status-spinner" style={{ borderTopColor: primaryColor }} />
            <span>Bağlanıyor...</span>
          </div>
        )}

        {isConnected && (
          <div className="wespoke-status-indicator wespoke-status-connected">
            <div className="wespoke-status-dot wespoke-status-dot-active" style={{ backgroundColor: accentColor }} />
            <span>Bağlandı</span>
          </div>
        )}
      </div>

      {/* Consent Message (shown only when requireConsent is true and idle) */}
      {requireConsent && isIdle && (
        <div className="wespoke-consent-message">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>Mikrofon erişimine izin vermeniz gerekecek</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="wespoke-control-buttons">
        {!isConnected && !isConnecting && (
          <button
            className="wespoke-control-button wespoke-control-button-start"
            onClick={onStartCall}
            disabled={isConnecting}
            aria-label="Aramayı Başlat"
            style={{ backgroundColor: primaryColor }}
          >
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
            <span>Aramayı Başlat</span>
          </button>
        )}

        {isConnected && (
          <>
            <button
              className={`wespoke-control-button wespoke-control-button-mute ${isMuted ? 'wespoke-control-button-muted' : ''}`}
              onClick={onToggleMute}
              aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              style={{
                backgroundColor: isMuted ? '#ef4444' : 'var(--wespoke-bg-tertiary)',
                borderColor: isMuted ? '#ef4444' : 'var(--wespoke-border-secondary)'
              }}
            >
              {isMuted ? (
                <>
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
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  <span>Kapalı</span>
                </>
              ) : (
                <>
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
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  <span>Mikrofon</span>
                </>
              )}
            </button>

            <button
              className="wespoke-control-button wespoke-control-button-end"
              onClick={onEndCall}
              aria-label="Aramayı Bitir"
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
              <span>Aramayı Bitir</span>
            </button>
          </>
        )}
      </div>

      {/* Audio Wave Visualization (when connected and not muted) */}
      {isConnected && !isMuted && (
        <div className="wespoke-audio-wave">
          <div className="wespoke-wave-bar" style={{ backgroundColor: primaryColor }} />
          <div className="wespoke-wave-bar" style={{ backgroundColor: primaryColor }} />
          <div className="wespoke-wave-bar" style={{ backgroundColor: primaryColor }} />
          <div className="wespoke-wave-bar" style={{ backgroundColor: accentColor }} />
          <div className="wespoke-wave-bar" style={{ backgroundColor: accentColor }} />
        </div>
      )}
    </div>
  );
};
