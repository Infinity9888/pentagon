import React, { useEffect, useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import { useTranslation } from '../../i18n';

interface ServersViewProps {
    instanceId: string;
}

interface ServerInfo {
    name: string;
    ip: string;
}

export default function ServersView({ instanceId }: ServersViewProps) {
    const { t } = useTranslation();
    const [servers, setServers] = useState<ServerInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [ip, setIp] = useState('');
    const [adding, setAdding] = useState(false);
    const [serverToDelete, setServerToDelete] = useState<string | null>(null);

    const loadServers = async () => {
        setLoading(true);
        try {
            const list = await window.pentagon?.servers?.get?.(instanceId);
            setServers(list || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServers();
    }, [instanceId]);

    const handleAddServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !ip) return;
        setAdding(true);

        try {
            const res = await window.pentagon?.servers?.add?.(instanceId, { name, ip });
            console.log("[ServersView] res from add:", res);
            if (res && res.success) {
                setName('');
                setIp('');
                await loadServers();
            } else {
                alert('Add Add Server Error Payload: ' + JSON.stringify(res));
            }
        } catch (err: any) {
            alert('Failed to add server completely: ' + err.message);
        } finally {
            setAdding(false);
        }
    };

    const confirmDelete = async () => {
        if (!serverToDelete) return;
        try {
            await window.pentagon?.servers?.remove?.(instanceId, serverToDelete);
            await loadServers();
        } catch (e: any) {
            console.error('Failed to remove server', e);
        } finally {
            setServerToDelete(null);
        }
    };

    return (
        <div className="config-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="view-header">
                <h3>{t('instances.config.servers.title')}</h3>
                <p>{t('instances.config.servers.desc')}</p>
            </div>

            <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}>
                <form className="add-server-form" onSubmit={handleAddServer} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)'
                }}>
                    <h4 style={{ margin: 0, color: 'var(--color-text)' }}>{t('instances.config.servers.addTitle')}</h4>
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>{t('instances.config.servers.name')}</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('instances.config.servers.namePlaceholder')}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={adding}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                            <label>{t('instances.config.servers.ip')}</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('instances.config.servers.ipPlaceholder')}
                                value={ip}
                                onChange={e => setIp(e.target.value)}
                                disabled={adding}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={adding || !name || !ip}>
                            {adding ? t('instances.config.servers.adding') : t('instances.config.servers.addBtn')}
                        </button>
                    </div>
                </form>

                <div className="servers-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                    <h4 style={{ margin: 0, color: 'var(--color-text)' }}>
                        {t('instances.config.servers.installed', { count: servers.length })}
                    </h4>

                    {loading ? (
                        <div className="empty-state">{t('instances.config.servers.loading')}</div>
                    ) : servers.length === 0 ? (
                        <div className="empty-state">{t('instances.config.servers.empty')}</div>
                    ) : (
                        servers.map((s, i) => (
                            <div key={i} style={{
                                background: 'transparent',
                                borderBottom: '1px solid var(--color-border)',
                                padding: 'var(--space-3) 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'var(--transition-colors)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                    <div style={{
                                        width: 48, height: 48,
                                        background: 'var(--color-surface-hover)',
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                            <line x1="6" y1="6" x2="6" y2="6" />
                                            <line x1="6" y1="18" x2="6" y2="18" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '15px' }}>{s.name}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>{s.ip}</div>
                                    </div>
                                </div>
                                <button
                                    className="btn-icon text-error hover-action"
                                    onClick={() => setServerToDelete(s.ip)}
                                    title={t('instances.config.servers.removeHover')}
                                    style={{ padding: '8px', opacity: 0.8 }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!serverToDelete}
                title={t('instances.config.servers.removeTitle')}
                message={t('instances.config.servers.removeMsg', { server: serverToDelete || '' })}
                confirmText={t('instances.config.servers.removeBtn')}
                cancelText={t('home.cancel') || 'Отмена'}
                onConfirm={confirmDelete}
                onCancel={() => setServerToDelete(null)}
                isDestructive={true}
            />
        </div >
    );
}
