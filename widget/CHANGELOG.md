# Changelog

All notable changes to the Wespoke Web Widget will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-02

### Added
- Initial release of Wespoke Web Widget
- Complete pre-built UI component for AI voice assistants
- Real-time voice conversations via LiveKit WebRTC
- Message transcript display with real-time updates
- Customizable theming (dark/light themes)
- Brand color customization (primary and accent colors)
- Position configuration (bottom-right, bottom-left, top-right, top-left)
- Size options (compact, medium, full)
- Floating action button with badge support
- Voice controls (start call, end call, toggle mute)
- Microphone permission consent flow
- Event callbacks (onCallStart, onCallEnd, onMessage, onError, onTranscriptUpdate, onStateChange)
- TypeScript type definitions
- React component support
- Vanilla JavaScript support via UMD bundle
- CDN distribution support
- Multiple bundle formats (UMD, ESM, CJS)
- Comprehensive documentation
- Working CDN example

### Technical Details
- Built with React 18
- Powered by @wespoke/web-sdk v0.1.5
- Supports React 18+ as peer dependency
- Cross-browser compatibility (Chrome/Edge 90+, Firefox 88+, Safari 14+)
- Responsive design for mobile and desktop
- ARIA labels for accessibility
- Keyboard navigation support

### Dependencies
- @wespoke/web-sdk: ^0.1.5
- React: ^18.0.0 (peer dependency)
- ReactDOM: ^18.0.0 (peer dependency)

### Known Limitations
- Voice agent must be running for voice functionality to work
- Requires HTTPS in production (localhost allowed for development)
- API methods (open, close, toggle, etc.) return placeholder implementations

## [Unreleased]

### Planned
- React example application
- Next.js example application
- Implement working API methods for programmatic control
- Additional theme customization options
- More size variations
- Animation improvements
- Enhanced error handling UI
