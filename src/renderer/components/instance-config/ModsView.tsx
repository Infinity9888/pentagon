import React, { useState, useEffect } from 'react';
import ConfirmModal from '../ConfirmModal';
import { useTranslation } from '../../i18n';
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
    const { t } = useTranslation();
    const [mods, setMods] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(true);
    const [modToDelete, setModToDelete] = useState<string | null>(null);

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

    const confirmDelete = async () => {
        if (!modToDelete) return;
        await window.pentagon?.instances?.deleteMod?.(instanceId, modToDelete);
        setModToDelete(null);
        loadMods();
    };

    const handleAddJar = async () => {
        const res = await window.pentagon?.instances?.addLocalJar?.(instanceId);
        if (res && res.success) {
            loadMods();
        }
    };

    return (
        <>
            <div className="config-view animate-fade-in">
                <div className="view-header flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3>{t('instances.config.mods.title', { count: (mods || []).length })}</h3>
                        <p>{t('instances.config.mods.desc')}</p>
                    </div>
                    <div className="view-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'mods')}>
                            {t('instances.config.openFolder')}
                        </button>
                        <button className="btn btn-secondary" onClick={handleAddJar}>{t('instances.config.mods.addJar')}</button>
                    </div>
                </div>

                <div className="view-content">
                    {loading ? (
                        <div className="loading-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('instances.config.loading')}</div>
                    ) : !mods || mods.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('instances.config.mods.empty')}</div>
                    ) : (
                        <table className="data-table mods-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>{t('instances.config.mods.colEnabled')}</th>
                                    <th>{t('instances.config.mods.colName')}</th>
                                    <th>{t('instances.config.mods.colFile')}</th>
                                    <th style={{ width: 80 }}>{t('instances.config.mods.colActions')}</th>
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
                                            <button className="btn-icon text-error hover-action" onClick={() => setModToDelete(mod.fileName)} title={t('instances.config.mods.deleteTitle').replace('?', '')}>
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

            <ConfirmModal
                isOpen={!!modToDelete}
                title={t('instances.config.mods.deleteTitle')}
                message={t('instances.config.mods.deleteMsg', { mod: modToDelete || '' })}
                confirmText={t('instances.config.mods.deleteTitle').replace('?', '')}
                cancelText={t('home.cancel')}
                onConfirm={confirmDelete}
                onCancel={() => setModToDelete(null)}
                isDestructive={true}
            />
        </>
    );
}
