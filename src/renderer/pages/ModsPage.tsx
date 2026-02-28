import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import './ModsPage.css';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function ModsPage() {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 700);
    const [activeTab, setActiveTab] = useState<'modrinth' | 'curseforge' | 'installed'>('modrinth');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [downloadTarget, setDownloadTarget] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<string>('');
    const [instances, setInstances] = useState<any[]>([]);
    const [selectedInstalledInstanceId, setSelectedInstalledInstanceId] = useState<string>('');
    const [installedMods, setInstalledMods] = useState<any[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(false);
    const [modToDelete, setModToDelete] = useState<string | null>(null);
    const [focusedMod, setFocusedMod] = useState<any>(null);

    const [targetInstanceId, setTargetInstanceId] = useState<string>('');
    const [availableVersions, setAvailableVersions] = useState<any[] | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);

    useEffect(() => {
        window.pentagon?.instances?.list?.()
            .then((list: any[]) => {
                const modded = (list || []).filter((inst: any) =>
                    inst.config?.version?.fabric ||
                    inst.config?.version?.forge ||
                    inst.config?.version?.quilt ||
                    inst.config?.version?.neoforge
                );
                setInstances(modded);
                if (modded.length > 0) {
                    setSelectedInstalledInstanceId(modded[0].id);
                }
            })
            .catch((e: any) => console.error('Failed to load apps', e));
    }, []);

    useEffect(() => {
        if (downloadTarget && targetInstanceId && activeTab !== 'installed') {
            setIsLoadingVersions(true);
            setAvailableVersions(null);
            window.pentagon?.mods?.getFiles?.(targetInstanceId, downloadTarget.project_id, downloadTarget.provider)
                .then((versions: any) => {
                    setAvailableVersions(versions || []);
                    if (versions && versions.length > 0) {
                        setSelectedVersionId(versions[0].id.toString());
                    } else {
                        setSelectedVersionId('');
                    }
                })
                .catch((err: any) => {
                    console.error("Failed to load versions", err);
                    setAvailableVersions([]);
                })
                .finally(() => {
                    setIsLoadingVersions(false);
                });
        }
    }, [downloadTarget, targetInstanceId, activeTab]);

    useEffect(() => {
        if (activeTab === 'installed' && selectedInstalledInstanceId) {
            loadInstalledMods(selectedInstalledInstanceId);
        }
    }, [activeTab, selectedInstalledInstanceId]);

    const loadInstalledMods = async (id: string) => {
        setLoadingInstalled(true);
        try {
            const list = await window.pentagon?.instances?.listMods?.(id);
            setInstalledMods(list || []);
        } catch (e) {
            console.error('Failed to load installed mods', e);
        } finally {
            setLoadingInstalled(false);
        }
    };

    const handleToggleInstalledMod = async (fileName: string) => {
        if (!selectedInstalledInstanceId) return;
        await window.pentagon?.instances?.toggleMod?.(selectedInstalledInstanceId, fileName);
        loadInstalledMods(selectedInstalledInstanceId);
    };

    const handleDeleteInstalledMod = async (fileName: string) => {
        if (!selectedInstalledInstanceId) return;
        setModToDelete(fileName);
    };

    const confirmDeleteMod = async () => {
        if (!selectedInstalledInstanceId || !modToDelete) return;
        await window.pentagon?.instances?.deleteMod?.(selectedInstalledInstanceId, modToDelete);
        setModToDelete(null);
        loadInstalledMods(selectedInstalledInstanceId);
    };

    const handleDownloadClick = async (project: any) => {
        setDownloadTarget(project);
        setTargetInstanceId('');
        setAvailableVersions(null);
        setSelectedVersionId('');
        try {
            const list = await window.pentagon?.instances?.list?.();
            const modded = (list || []).filter((inst: any) =>
                inst.config?.version?.fabric ||
                inst.config?.version?.forge ||
                inst.config?.version?.quilt ||
                inst.config?.version?.neoforge
            );
            setInstances(modded);
        } catch (e) {
            console.error('Failed to load instances', e);
        }
    };

    useEffect(() => {
        const triggerSearch = async () => {
            if (activeTab === 'installed') return;
            if (!debouncedQuery.trim()) {
                setSearchResults([]);
                return;
            }

            if (activeTab === 'modrinth' || activeTab === 'curseforge') {
                setIsSearching(true);
                setSearchError(null);
                try {
                    const res = await window.pentagon?.mods?.search?.(debouncedQuery, 'mod', activeTab);
                    const hitsWithProvider = (res?.hits || []).map((hit: any) => ({ ...hit, provider: activeTab }));
                    setSearchResults(hitsWithProvider);
                } catch (err: any) {
                    console.error('Search failed', err);
                    const msg = err?.message || String(err);
                    setSearchError(`Ошибка при поиске: ${msg}`);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }
        };

        triggerSearch();
    }, [debouncedQuery, activeTab]);

    useEffect(() => {
        const handleProgress = (data: { modId: string; message: string }) => {
            if (downloadTarget && data.modId === downloadTarget.project_id) {
                setDownloadProgress(data.message);
            }
        };

        if (window.pentagon?.mods?.onInstallProgress) {
            const cleanup = window.pentagon.mods.onInstallProgress(handleProgress);
            return cleanup;
        }
    }, [downloadTarget]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (!isDownloading && downloadTarget) { setDownloadTarget(null); return; }
                if (modToDelete) { setModToDelete(null); return; }
                if (focusedMod) { setFocusedMod(null); return; }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [downloadTarget, modToDelete, isDownloading, focusedMod]);

    return (
        <div className="page mods-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header">
                <h2 className="page-title">{t('mods.title')}</h2>
            </div>

            {activeTab !== 'installed' && (
                <div className="mods-search-bar">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={`${t('mods.search')} ${activeTab === 'modrinth' ? 'Modrinth' : 'CurseForge'}`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            <div className="mods-tabs">
                <button className={`tab ${activeTab === 'modrinth' ? 'active' : ''}`} onClick={() => { setActiveTab('modrinth'); setSearchResults([]); setSearchError(null); }}>Modrinth</button>
                <button className={`tab ${activeTab === 'curseforge' ? 'active' : ''}`} onClick={() => { setActiveTab('curseforge'); setSearchResults([]); setSearchError(null); }}>CurseForge</button>
                <button className={`tab ${activeTab === 'installed' ? 'active' : ''}`} onClick={() => { setActiveTab('installed'); setSearchResults([]); setSearchError(null); }}>{t('mods.installed')}</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {activeTab === 'installed' ? (
                    <div style={{ padding: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                            <label style={{ fontWeight: 600 }}>{t('mods.selectInstance')}</label>
                            <select
                                className="form-select"
                                style={{ maxWidth: '300px' }}
                                value={selectedInstalledInstanceId}
                                onChange={e => setSelectedInstalledInstanceId(e.target.value)}
                            >
                                {instances.length === 0 && <option value="">{t('mods.noInstances')}</option>}
                                {instances.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.config.name}</option>
                                ))}
                            </select>
                        </div>

                        {loadingInstalled ? (
                            <div className="empty-state">{t('mods.downloading')}</div>
                        ) : installedMods.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {installedMods.map((mod: any, idx: number) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: 'var(--space-3)', background: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                        opacity: mod.enabled ? 1 : 0.6
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mod.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{mod.fileName}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            <button
                                                className={`btn ${mod.enabled ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => handleToggleInstalledMod(mod.fileName)}
                                            >
                                                {mod.enabled ? 'Вкл' : 'Выкл'}
                                            </button>
                                            <button
                                                className="btn btn-secondary text-error hover-action"
                                                onClick={() => handleDeleteInstalledMod(mod.fileName)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p style={{ color: 'var(--color-text-secondary)' }}>{t('mods.notFound')}</p>
                            </div>
                        )}
                    </div>
                ) : searchError ? (
                    <div className="empty-state">
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                            <p style={{ color: '#ef4444', fontWeight: 600, margin: '0 0 var(--space-2) 0' }}>⚠️ {t('mods.searchError')}</p>
                            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>{searchError}</p>
                        </div>
                    </div>
                ) : isSearching ? (
                    <div className="empty-state">
                        <p style={{ color: 'var(--color-text-muted)' }}>Загрузка результатов...</p>
                    </div>
                ) : searchResults.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
                        {searchResults.map(result => (
                            <div key={result.project_id} className="mod-card hover-glow cursor-pointer" style={{
                                display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)',
                                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)', alignItems: 'flex-start',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }} onClick={() => setFocusedMod(result)}>
                                {result.icon_url ? (
                                    <img src={result.icon_url} alt="icon" style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', objectFit: 'cover', imageRendering: 'pixelated' }} />
                                ) : (
                                    <div style={{ width: 64, height: 64, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>{result.title}</h3>
                                    <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>by {result.author}</p>
                                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{result.description}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        {result.downloads > 1000 ? (result.downloads / 1000).toFixed(1) + 'k' : result.downloads}
                                    </div>
                                    <button className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)' }} onClick={(e) => { e.stopPropagation(); handleDownloadClick(result); }}>
                                        {t('mods.download')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        {searchQuery && !isSearching ? (
                            <>
                                <h3>{t('mods.notFound')}</h3>
                                <p>{t('mods.searchPrompt')}</p>
                            </>
                        ) : (
                            <>
                                <h3>{t('mods.title')}</h3>
                                <p>{t('mods.searchPrompt')} {activeTab === 'modrinth' ? 'Modrinth' : 'CurseForge'}</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Mod Details Modal */}
            {focusedMod && (
                <div className="modal-backdrop animate-fade-in" style={{ zIndex: 90 }} onClick={(e) => { if (e.target === e.currentTarget) setFocusedMod(null); }}>
                    <div className="create-modal animate-slide-up" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="create-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                {focusedMod.icon_url && <img src={focusedMod.icon_url} alt="icon" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', objectFit: 'cover', imageRendering: 'pixelated' }} />}
                                {focusedMod.title}
                            </h2>
                            <button className="btn-icon" onClick={() => setFocusedMod(null)} title={t('home.close')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="create-body custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-text-muted)' }}>{t('mods.author')} <strong style={{ color: 'var(--color-text-primary)' }}>{focusedMod.author}</strong></p>
                                    <p style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-text-muted)' }}>{t('mods.downloads')} <strong style={{ color: 'var(--color-text-primary)' }}>{focusedMod.downloads}</strong></p>
                                    {focusedMod.categories && focusedMod.categories.length > 0 && (
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                                            {focusedMod.categories.map((cat: string) => <span key={cat} style={{ background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{cat}</span>)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <button className="btn btn-primary" onClick={() => handleDownloadClick(focusedMod)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        {t('mods.installMod')}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>{t('mods.desc')}</h3>
                                <p style={{ lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px' }}>
                                    {focusedMod.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {downloadTarget && (
                <div className="modal-backdrop animate-fade-in" style={{ zIndex: 100 }}>
                    <div className="create-modal animate-slide-up" style={{ maxWidth: '400px' }}>
                        <div className="create-header">
                            <h2>{t('mods.installTitle')}</h2>
                            <button className="btn-icon" onClick={() => setDownloadTarget(null)} title={t('home.close')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="create-body">
                            <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                {t('mods.installConfirm')} <strong style={{ color: 'var(--color-text-primary)' }}>{downloadTarget.title}</strong>.
                                {!targetInstanceId ? ` ${t('mods.selectInstance')}` : ''}
                            </p>

                            {!targetInstanceId ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                                    {instances.length > 0 ? instances.map(inst => (
                                        <button
                                            key={inst.id}
                                            className="btn btn-secondary"
                                            style={{ justifyContent: 'flex-start', padding: 'var(--space-3)', width: '100%', height: 'auto', border: '1px solid var(--color-border)' }}
                                            disabled={isDownloading}
                                            onClick={() => setTargetInstanceId(inst.id)}
                                        >
                                            <div style={{ textAlign: 'left', flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{inst.config.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                    {inst.config.version.fabric ? `Fabric ${inst.config.version.fabric} ` : inst.config.version.forge ? `Forge ${inst.config.version.forge} ` : 'Vanilla '}
                                                    ({inst.config.version.minecraft})
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="text-center" style={{ color: 'var(--color-text-muted)', padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>{t('mods.noInstances')}</div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'center' }}
                                        onClick={() => { setTargetInstanceId(''); setAvailableVersions(null); }}
                                        disabled={isDownloading}
                                    >
                                        &larr; {t('mods.selectOther')}
                                    </button>

                                    {isLoadingVersions ? (
                                        <div className="text-center" style={{ color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>{t('mods.fetchingVersions')}</div>
                                    ) : availableVersions && availableVersions.length > 0 ? (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                <label style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{t('mods.selectVersion')}</label>
                                                <select className="form-select" style={{ width: '100%' }} value={selectedVersionId} onChange={e => setSelectedVersionId(e.target.value)} disabled={isDownloading}>
                                                    {availableVersions.map(v => (
                                                        <option key={v.id} value={v.id.toString()}>
                                                            {v.version_number ? `${v.version_number} (${v.version_type || 'release'})` : v.displayName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{ justifyContent: 'center', marginTop: 'var(--space-2)' }}
                                                disabled={isDownloading || !selectedVersionId}
                                                onClick={async () => {
                                                    setIsDownloading(true);
                                                    setDownloadProgress('Starting download...');
                                                    try {
                                                        await window.pentagon?.mods?.install?.(targetInstanceId, downloadTarget, selectedVersionId);
                                                        setDownloadTarget(null);
                                                    } catch (e: any) {
                                                        alert(`Ошибка скачивания: ${e.message}`);
                                                    } finally {
                                                        setIsDownloading(false);
                                                        setDownloadProgress('');
                                                    }
                                                }}
                                            >
                                                {t('mods.downloadVersionBtn')}
                                            </button>
                                        </>
                                    ) : availableVersions && availableVersions.length === 0 ? (
                                        <div className="text-center" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            {t('mods.noVersions')}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {isDownloading && (
                                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>{t('mods.downloadState')}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontWeight: 600 }}>{downloadProgress || t('mods.downloading')}</div>
                                </div>
                            )}
                        </div>
                        <div className="create-footer">
                            <button className="btn btn-secondary" disabled={isDownloading} onClick={() => setDownloadTarget(null)}>{t('home.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {modToDelete && (
                <div className="modal-backdrop animate-fade-in" style={{ zIndex: 100 }}>
                    <div className="create-modal animate-slide-up" style={{ maxWidth: '400px' }}>
                        <div className="create-header">
                            <h2>{t('mods.deleteTitle')}</h2>
                            <button className="btn-icon" onClick={() => setModToDelete(null)} title={t('home.close')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="create-body">
                            <p style={{ margin: '0', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                {t('mods.deleteConfirm')} <strong style={{ color: 'var(--color-text-primary)' }}>{modToDelete}</strong>?
                            </p>
                            <p style={{ margin: '10px 0 0 0', color: '#ef4444', fontSize: '13px' }}>
                                {t('mods.deleteWarning')}
                            </p>
                        </div>
                        <div className="create-footer">
                            <button className="btn btn-secondary" onClick={() => setModToDelete(null)}>{t('home.cancel')}</button>
                            <button className="btn btn-primary" style={{ background: '#ef4444', color: '#fff' }} onClick={confirmDeleteMod}>{t('mods.deleteYes')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
