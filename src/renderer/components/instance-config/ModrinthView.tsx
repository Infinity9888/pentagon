import React, { useState, useEffect } from 'react';
import './ConfigView.css';

interface ModrinthViewProps {
    instanceId: string;
}

export default function ModrinthView({ instanceId }: ModrinthViewProps) {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.pentagon?.instances?.getConfig?.(instanceId)
            .then((conf: any) => {
                setConfig(conf);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [instanceId]);

    if (loading) {
        return <div className="config-view animate-fade-in"><div className="loading-state" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Loading pack info...</div></div>;
    }

    if (!config || config.source?.type !== 'modrinth') {
        return (
            <div className="config-view animate-fade-in">
                <div className="view-header">
                    <h3>Modrinth Pack Information</h3>
                    <p>Manage remote modpack metadata and updates.</p>
                </div>
                <div className="empty-state" style={{ marginTop: '20px', padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>This instance is not linked to a Modrinth modpack.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="config-view animate-fade-in">
            <div className="view-header">
                <h3>Modrinth Pack Information</h3>
                <p>Manage remote modpack metadata and updates.</p>
            </div>

            <div className="view-content pack-info-card">
                <div className="pack-details">
                    <p><strong>Pack name:</strong> {config.name}</p>
                    <p><strong>Current version:</strong> {config.source?.versionId || 'Unknown'}</p>
                    <p><strong>Source:</strong> Modrinth | ID: {config.source?.id}</p>
                </div>

                <div className="pack-update-section" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                    <div className="update-controls">
                        <label>Update to version:</label>
                        <select className="form-select" disabled>
                            <option>Updates not implemented yet</option>
                        </select>
                        <button className="btn btn-primary" disabled>Update pack</button>
                    </div>

                    <div className="changelog-box">
                        <h4>Changelog</h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Auto-updating is planned for a future release.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
