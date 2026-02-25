import React, { useState, useEffect } from 'react';
import './ConfigView.css';

interface VersionViewProps {
    instanceId: string;
}

export default function VersionView({ instanceId }: VersionViewProps) {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [mcVersions, setMcVersions] = useState<any[]>([]);
    const [loaderVersions, setLoaderVersions] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const conf = await window.pentagon?.instances?.getConfig?.(instanceId);
                setConfig(conf);

                // Fetch MC versions
                const mcList = await window.pentagon?.versions?.getMinecraft?.();
                setMcVersions(mcList || []);

                // Fetch loader versions based on current config
                if (conf?.version?.fabric) {
                    const fabricList = await window.pentagon?.versions?.getFabric?.(conf.version.minecraft);
                    setLoaderVersions(fabricList || []);
                } else if (conf?.version?.forge) {
                    const forgeList = await window.pentagon?.versions?.getForge?.(conf.version.minecraft);
                    setLoaderVersions(forgeList || []);
                }
            } catch (e) {
                console.error('Failed to load version view data', e);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [instanceId]);

    const handleVersionChange = async (type: 'minecraft' | 'fabric' | 'forge', newValue: string) => {
        if (!config || isSaving) return;
        setIsSaving(true);

        try {
            const newConfig = { ...config };
            newConfig.version[type] = newValue;

            // If we changed minecraft version, we need to refresh loader versions and possibly clear the old loader version
            if (type === 'minecraft') {
                if (newConfig.version.fabric) {
                    const newFabric = await window.pentagon?.versions?.getFabric?.(newValue);
                    setLoaderVersions(newFabric || []);
                    if (newFabric && newFabric.length > 0) newConfig.version.fabric = newFabric[0].version;
                } else if (newConfig.version.forge) {
                    const newForge = await window.pentagon?.versions?.getForge?.(newValue);
                    setLoaderVersions(newForge || []);
                    if (newForge && newForge.length > 0) newConfig.version.forge = newForge[0].version;
                }
            }

            await window.pentagon?.instances?.updateConfig?.(instanceId, newConfig);
            setConfig(newConfig);
        } catch (e) {
            console.error('Failed to update config version', e);
            alert('Failed to update version');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="config-view animate-fade-in"><div className="loading-state" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Loading version info...</div></div>;
    }

    if (!config) {
        return <div className="config-view animate-fade-in"><div className="error-state" style={{ padding: '2rem', color: 'var(--color-error)' }}>Failed to load instance config.</div></div>;
    }

    return (
        <div className="config-view animate-fade-in">
            <div className="view-header flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3>Version Details</h3>
                    <p>Manage the core components installed for this instance.</p>
                </div>
                <div className="view-actions">
                    <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId)}>
                        Open Folder
                    </button>
                </div>
            </div>

            <div className="view-content">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Version</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>LWJGL 3</td>
                            <td>(Auto-resolved)</td>
                            <td className="status-ok">✔ Active</td>
                        </tr>
                        <tr>
                            <td>Minecraft</td>
                            <td>
                                <select
                                    className="form-select"
                                    value={config.version.minecraft}
                                    onChange={(e) => handleVersionChange('minecraft', e.target.value)}
                                    disabled={isSaving}
                                    style={{ padding: 'var(--space-1) var(--space-2)' }}
                                >
                                    {mcVersions.map(v => (
                                        <option key={v.id} value={v.id}>{v.id}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="status-ok">✔ Configured</td>
                        </tr>
                        {config.version.fabric && (
                            <tr>
                                <td>Fabric Loader</td>
                                <td>
                                    <select
                                        className="form-select"
                                        value={config.version.fabric}
                                        onChange={(e) => handleVersionChange('fabric', e.target.value)}
                                        disabled={isSaving}
                                        style={{ padding: 'var(--space-1) var(--space-2)' }}
                                    >
                                        {loaderVersions.map(v => (
                                            <option key={v.version} value={v.version}>{v.version}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="status-ok">✔ Configured</td>
                            </tr>
                        )}
                        {config.version.forge && (
                            <tr>
                                <td>Forge</td>
                                <td>
                                    <select
                                        className="form-select"
                                        value={config.version.forge}
                                        onChange={(e) => handleVersionChange('forge', e.target.value)}
                                        disabled={isSaving}
                                        style={{ padding: 'var(--space-1) var(--space-2)' }}
                                    >
                                        {loaderVersions.length === 0 && <option value={config.version.forge}>{config.version.forge}</option>}
                                        {loaderVersions.map(v => (
                                            <option key={v.version} value={v.version}>{v.version}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="status-ok">✔ Configured</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
