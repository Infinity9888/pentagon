import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import './ConfigView.css';

interface ModpackViewProps {
    instanceId: string;
}

export default function ModpackView({ instanceId }: ModpackViewProps) {
    const { t } = useTranslation();
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
        return <div className="config-view animate-fade-in"><div className="loading-state" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>{t('instances.config.modpack.loading')}</div></div>;
    }

    if (!config || !config.source || !['modrinth', 'curseforge'].includes(config.source?.type)) {
        return (
            <div className="config-view animate-fade-in">
                <div className="view-header">
                    <h3>{t('instances.config.modpack.title')}</h3>
                    <p>{t('instances.config.modpack.desc')}</p>
                </div>
                <div className="empty-state" style={{ marginTop: '20px', padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('instances.config.modpack.notLinked')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="config-view animate-fade-in">
            <div className="view-header">
                <h3>{t('instances.config.modpack.title')}</h3>
                <p>{t('instances.config.modpack.desc')}</p>
            </div>

            <div className="view-content pack-info-card">
                <div className="pack-details">
                    <p><strong>{t('instances.config.modpack.packName')}</strong> {config.name}</p>
                    <p><strong>{t('instances.config.modpack.curVer')}</strong> {config.source?.versionId || t('instances.config.modpack.unknown')}</p>
                    <p><strong>{t('instances.config.modpack.source')}</strong> {config.source?.type === 'curseforge' ? 'CurseForge' : 'Modrinth'} | ID: {config.source?.id || config.source?.modpackId || config.source?.projectId}</p>
                </div>

                <div className="pack-update-section" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                    <div className="update-controls">
                        <label>{t('instances.config.modpack.updateTo')}</label>
                        <select className="form-select" disabled>
                            <option>{t('instances.config.modpack.notImpl')}</option>
                        </select>
                        <button className="btn btn-primary" disabled>{t('instances.config.modpack.updateBtn')}</button>
                    </div>

                    <div className="changelog-box">
                        <h4>{t('instances.config.modpack.changelog')}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{t('instances.config.modpack.changelogNotImpl')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
