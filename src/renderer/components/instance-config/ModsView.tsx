import React, { useState, useEffect } from 'react';
import './ConfigView.css';

interface ModsViewProps {
    instanceId: string;
}

interface Mod {
    name: string;
    fileName: string;
    enabled: boolean;
}

export default function ModsView({ instanceId }: ModsViewProps) {
    const [mods, setMods] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMods = () => {
        setLoading(true);
        window.pentagon?.instances?.listMods?.(instanceId)
            .then((list: Mod[]) => {
                setMods(list || []);
                setLoading(false);
            })
            .catch((e: any) => {
                console.error('Failed to load mods:', e);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadMods();
    }, [instanceId]);

    const toggleMod = async (fileName: string) => {
        await window.pentagon?.instances?.toggleMod?.(instanceId, fileName);
        loadMods();
    };

    const deleteMod = async (fileName: string) => {
        if (!confirm('Are you sure you want to delete this mod?')) return;
        await window.pentagon?.instances?.deleteMod?.(instanceId, fileName);
        loadMods();
    };

    return (
        <div className="config-view animate-fade-in">
            <div className="view-header flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3>Mods ({(mods || []).length} installed)</h3>
                    <p>Enable, disable, or delete modifications.</p>
                </div>
                <div className="view-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'mods')}>
                        Open Folder
                    </button>
                    <button className="btn btn-secondary" disabled>Add .jar</button>
                </div>
            </div>

            <div className="view-content">
                {loading ? (
                    <div className="loading-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading mods...</div>
                ) : !mods || mods.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No mods installed in this instance.</div>
                ) : (
                    <table className="data-table mods-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>Enabled</th>
                                <th>Mod Name</th>
                                <th>File Name</th>
                                <th style={{ width: 80 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(mods || []).map(mod => (
                                <tr key={mod.fileName} className={!mod.enabled ? 'disabled-row' : ''}>
                                    <td className="text-center">
                                        <input
                                            type="checkbox"
                                            checked={mod.enabled}
                                            onChange={() => toggleMod(mod.fileName)}
                                        />
                                    </td>
                                    <td><strong>{mod.name}</strong></td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>{mod.fileName}</td>
                                    <td>
                                        <button className="btn-icon text-error hover-action" onClick={() => deleteMod(mod.fileName)} title="Delete">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
