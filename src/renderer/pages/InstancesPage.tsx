import { useState, useEffect } from 'react';
import InstanceConfigModal from '../components/InstanceConfigModal';
import CreateInstanceModal from '../components/instances/CreateInstanceModal';
import { useTranslation } from '../i18n';
import './InstancesPage.css';

export default function InstancesPage() {
    const { t } = useTranslation();
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchStatus, setLaunchStatus] = useState('');
    const [launchProgress, setLaunchProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [configInstanceId, setConfigInstanceId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [instances, setInstances] = useState<any[]>([]);

    const instanceToDelete = instances.find(i => i.id === deleteConfirmId);

    const loadInstances = async () => {
        try {
            const list = await window.pentagon?.instances?.list?.();
            setInstances(list || []);
        } catch (e) {
            console.error('Failed to load instances', e);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDeleteConfirmId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        loadInstances();
        // Listen to launch progress events from the main process
        const unsubProgress = window.pentagon?.instances?.onLaunchProgress?.((data: any) => {
            setLaunchStatus(data.status);
            if (data.total && data.current) {
                setLaunchProgress((data.current / data.total) * 100);
            } else {
                setLaunchProgress(0); // Indeterminate
            }

            if (data.status.includes('Game launched successfully')) {
                setIsPlaying(true);
                setTimeout(() => {
                    setIsLaunching(false);
                }, 1500);
            } else if (data.status.includes('Launch Error')) {
                setTimeout(() => {
                    setIsLaunching(false);
                    setLaunchStatus('');
                }, 4000); // Hide after 4 seconds on error
            }
        });

        const unsubLog = window.pentagon?.instances?.onInstanceLog?.((data: any) => {
            if (data.line.includes('Process exited')) {
                setIsPlaying(false);
                setIsLaunching(false);
            }
            setLogs(prev => [...prev.slice(-49), data.line]); // Keep last 50 lines
        });

        return () => {
            if (unsubProgress) unsubProgress();
            if (unsubLog) unsubLog();
        };
    }, []);

    const handlePlay = async (launchId: string) => {
        setIsLaunching(true);
        setLaunchStatus(t('instances.launching'));
        setLaunchProgress(0);
        setLogs([]);

        try {
            const res = await window.pentagon?.instances?.launch(launchId);
            if (res && res.error) {
                setLaunchStatus('Error: ' + res.error);
                setTimeout(() => setIsLaunching(false), 4000);
            }
        } catch (e: any) {
            setLaunchStatus('Fatal Error: ' + e.message);
            setTimeout(() => setIsLaunching(false), 4000);
        }
    };

    const handleKill = async (launchId: string) => {
        await window.pentagon?.instances?.kill(launchId);
        setIsPlaying(false);
    };

    return (
        <div className="page instances-page animate-fade-in">
            <div className="page-header">
                <h2 className="page-title">{t('instances.title')}</h2>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)} disabled={isLaunching}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('instances.new')}
                </button>
            </div>

            <div className="instances-grid">
                {instances.map(instance => (
                    <div key={instance.id} className="instance-card">
                        <div className="instance-icon default-icon">
                            <img src="https://minecraft.wiki/images/Crafting_Table_JE4_BE3.png" alt="Icon" />
                        </div>
                        <div className="instance-info">
                            <h3>{instance.config.name}</h3>
                            <p>{instance.config.version?.fabric ? `Fabric ${instance.config.version.fabric} ` : instance.config.version?.forge ? `Forge ${instance.config.version.forge} ` : 'Vanilla '}
                                ({instance.config.version?.minecraft || 'Unknown'})</p>
                        </div>
                        <div className="instance-actions">
                            <div className="instance-actions-row">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setConfigInstanceId(instance.id)}
                                    disabled={isLaunching || isPlaying}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 var(--space-2)' }}
                                    title="Configure Instance"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                    {t('instances.configure')}
                                </button>
                                <button
                                    className="btn btn-secondary text-error hover-action"
                                    onClick={() => setDeleteConfirmId(instance.id)}
                                    disabled={isLaunching || isPlaying}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 var(--space-2)' }}
                                    title="Delete Instance"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                    </svg>
                                </button>
                            </div>
                            {isPlaying ? (
                                <button
                                    className="btn btn-error"
                                    onClick={() => handleKill(instance.id)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 'var(--space-2)' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                        <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                                    </svg>
                                    {t('instances.kill')}
                                </button>
                            ) : (
                                <button
                                    className="btn btn-play"
                                    onClick={() => handlePlay(instance.id)}
                                    disabled={isLaunching}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 'var(--space-2)' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                    {t('instances.play')}
                                </button>
                            )}
                        </div>

                        {isLaunching && (
                            <div className="instance-launch-overlay animate-fade-in" style={{ height: 'auto', minHeight: '120px', paddingBottom: '16px' }}>
                                <div className="launch-spinner"></div>
                                <div className="launch-status">{launchStatus}</div>
                                {launchProgress > 0 && (
                                    <div className="launch-details" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                                        <span>{Math.round(launchProgress)}%</span>
                                    </div>
                                )}
                                {launchProgress > 0 && (
                                    <div className="launch-progress-bar">
                                        <div className="launch-progress-fill" style={{ width: `${launchProgress}%` }}></div>
                                    </div>
                                )}

                                {logs.length > 0 && (
                                    <div className="launch-console" style={{
                                        marginTop: '10px',
                                        maxHeight: '100px',
                                        overflowY: 'auto',
                                        background: 'rgba(0,0,0,0.5)',
                                        padding: '5px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontFamily: 'var(--font-family-mono)',
                                        textAlign: 'left',
                                        color: '#ccc'
                                    }}>
                                        {logs.map((log, i) => <div key={i}>{log}</div>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {configInstanceId && (
                <InstanceConfigModal
                    instanceId={configInstanceId}
                    onClose={() => setConfigInstanceId(null)}
                />
            )}

            {isCreating && (
                <CreateInstanceModal
                    onClose={() => setIsCreating(false)}
                    onCreated={() => {
                        setIsCreating(false);
                        loadInstances();
                    }}
                />
            )}

            {deleteConfirmId && instanceToDelete && (
                <div className="modal-backdrop animate-fade-in" style={{ zIndex: 100 }}>
                    <div className="create-modal animate-slide-up" style={{ maxWidth: '400px' }}>
                        <div className="create-header">
                            <h2>{t('instances.deleteConfirm')}</h2>
                            <button className="btn-icon" onClick={() => setDeleteConfirmId(null)} title={t('home.close')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="create-body">
                            <p style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                {t('instances.deleteText')} <strong style={{ color: 'var(--color-text-primary)' }}>{instanceToDelete.config.name}</strong>?
                            </p>
                            <p style={{ margin: 0, marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-error)', background: 'rgba(239, 68, 68, 0.1)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                                {t('instances.deleteWarning')}
                            </p>
                        </div>
                        <div className="create-footer" style={{ marginTop: 'var(--space-4)' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>{t('home.cancel')}</button>
                            <button
                                className="btn btn-error"
                                onClick={async () => {
                                    await window.pentagon?.instances?.delete?.(deleteConfirmId);
                                    setDeleteConfirmId(null);
                                    loadInstances();
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                </svg>
                                {t('instances.deleteYes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
