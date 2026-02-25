import React, { useState, useEffect } from 'react';
import './ConfigView.css';

interface ConsoleViewProps {
    instanceId: string;
}

export default function ConsoleView({ instanceId }: ConsoleViewProps) {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Connect to the same logger we used in InstancesPage
        const unsubLog = window.pentagon?.instances?.onInstanceLog?.((data: any) => {
            // Filter by instance ID (not strictly needed since we only launch one right now, but good practice)
            setLogs(prev => [...prev, data.line]);
        });
        return () => { if (unsubLog) unsubLog(); };
    }, []);

    const copyLogs = () => {
        navigator.clipboard.writeText(logs.join('\n'));
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="config-view animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="view-header flex-row">
                <div>
                    <h3>Minecraft Log</h3>
                    <p>Real-time game output for troubleshooting.</p>
                </div>
                <div className="view-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'logs')}>
                        Open Folder
                    </button>
                    <button className="btn btn-secondary" onClick={copyLogs}>Copy</button>
                    <button className="btn btn-secondary" onClick={clearLogs}>Clear</button>
                </div>
            </div>

            <div className="view-content console-output" style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)', backgroundColor: '#000', color: '#ccc', flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {logs.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-10)' }}>
                        Waiting for log output... Launch the game to view logs here.
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))
                )}
            </div>
        </div>
    );
}
