import { useState, useEffect } from 'react';
import './TitleBar.css';

declare global {
    interface Window {
        pentagon: any;
    }
}

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const cleanup = window.pentagon?.window?.onMaximizedChange?.((max: boolean) => {
            setIsMaximized(max);
        });
        return cleanup;
    }, []);

    return (
        <div className="titlebar drag-region">
            <div className="titlebar-left no-drag">
                <div className="titlebar-logo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                    <span className="titlebar-title">Pentagon</span>
                </div>
            </div>

            <div className="titlebar-center" />

            <div className="titlebar-controls no-drag">
                <button
                    className="titlebar-btn"
                    onClick={() => window.pentagon?.window?.minimize()}
                    aria-label="Minimize"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1.5" rx="0.75" fill="currentColor" /></svg>
                </button>
                <button
                    className="titlebar-btn"
                    onClick={() => window.pentagon?.window?.maximize()}
                    aria-label="Maximize"
                >
                    {isMaximized ? (
                        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="3" width="7.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M3 3V2.5A1 1 0 014 1.5h6a1 1 0 011 1V9a1 1 0 01-1 1H9.5" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
                    )}
                </button>
                <button
                    className="titlebar-btn titlebar-btn-close"
                    onClick={() => window.pentagon?.window?.close()}
                    aria-label="Close"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
            </div>
        </div>
    );
}
