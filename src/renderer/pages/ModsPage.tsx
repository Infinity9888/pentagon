import React, { useState, useEffect } from 'react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 700);
    const [activeTab, setActiveTab] = useState<'modrinth' | 'curseforge' | 'installed'>('modrinth');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [downloadTarget, setDownloadTarget] = useState<any>(null);
    const [instances, setInstances] = useState<any[]>([]);
    const [selectedInstalledInstanceId, setSelectedInstalledInstanceId] = useState<string>('');
    const [installedMods, setInstalledMods] = useState<any[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(false);

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
        if (confirm(`Remove ${fileName}?`)) {
            await window.pentagon?.instances?.deleteMod?.(selectedInstalledInstanceId, fileName);
            loadInstalledMods(selectedInstalledInstanceId);
        }
    };

    const handleDownloadClick = async (project: any) => {
        setDownloadTarget(project);
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
                try {
                    const res = await window.pentagon?.mods?.search?.(debouncedQuery, 'mod', activeTab);
                    setSearchResults(res?.hits || []);
                } catch (err) {
                    console.error('Search failed', err);
                } finally {
                    setIsSearching(false);
                }
            }
        };

        triggerSearch();
    }, [debouncedQuery, activeTab]);

    return (
        <div className="page mods-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header">
                <h2 className="page-title">Моды</h2>
            </div>

            {activeTab !== 'installed' && (
                <div className="mods-search-bar">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={`Поиск модов на ${activeTab === 'modrinth' ? 'Modrinth' : 'CurseForge'}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            <div className="mods-tabs">
                <button className={`tab ${activeTab === 'modrinth' ? 'active' : ''}`} onClick={() => { setActiveTab('modrinth'); setSearchResults([]); }}>Modrinth</button>
                <button className={`tab ${activeTab === 'curseforge' ? 'active' : ''}`} onClick={() => { setActiveTab('curseforge'); setSearchResults([]); }}>CurseForge</button>
                <button className={`tab ${activeTab === 'installed' ? 'active' : ''}`} onClick={() => { setActiveTab('installed'); setSearchResults([]); }}>Установленные</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {activeTab === 'installed' ? (
                    <div style={{ padding: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                            <label style={{ fontWeight: 600 }}>Выберите инстанс:</label>
                            <select
                                className="form-select"
                                style={{ maxWidth: '300px' }}
                                value={selectedInstalledInstanceId}
                                onChange={e => setSelectedInstalledInstanceId(e.target.value)}
                            >
                                {instances.length === 0 && <option value="">Нет созданных инстансов</option>}
                                {instances.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.config.name}</option>
                                ))}
                            </select>
                        </div>

                        {loadingInstalled ? (
                            <div className="empty-state">Загрузка модов...</div>
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
                                                {mod.enabled ? 'On' : 'Off'}
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
                                <p style={{ color: 'var(--color-text-secondary)' }}>Моды не найдены или инстанс не выбран.</p>
                            </div>
                        )}
                    </div>
                ) : isSearching ? (
                    <div className="empty-state">
                        <p style={{ color: 'var(--color-text-muted)' }}>Загрузка результатов...</p>
                    </div>
                ) : searchResults.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
                        {searchResults.map(result => (
                            <div key={result.project_id} style={{
                                display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)',
                                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)', alignItems: 'flex-start'
                            }}>
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
                                    <button className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)' }} onClick={() => handleDownloadClick(result)}>
                                        Скачать
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
                                <h3>Ничего не найдено</h3>
                                <p>Попробуйте изменить запрос</p>
                            </>
                        ) : (
                            <>
                                <h3>Поиск модов</h3>
                                <p>Введите запрос для поиска модов на {activeTab === 'modrinth' ? 'Modrinth' : 'CurseForge'}</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {downloadTarget && (
                <div className="modal-backdrop animate-fade-in" style={{ zIndex: 100 }}>
                    <div className="create-modal animate-slide-up" style={{ maxWidth: '400px' }}>
                        <div className="create-header">
                            <h2>Выберите инстанс</h2>
                            <button className="btn-icon" onClick={() => setDownloadTarget(null)} title="Закрыть">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="create-body">
                            <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                Вы собираетесь скачать мод <strong style={{ color: 'var(--color-text-primary)' }}>{downloadTarget.title}</strong>. Выберите инстанс для установки:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                                {instances.length > 0 ? instances.map(inst => (
                                    <button
                                        key={inst.id}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', padding: 'var(--space-3)', width: '100%', height: 'auto', border: '1px solid var(--color-border)' }}
                                        onClick={() => {
                                            alert(`Скачка мода ${downloadTarget.title} в инстанс ${inst.config.name} (В разработке - требуется API скачивания)`);
                                            setDownloadTarget(null);
                                        }}
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
                                    <div className="text-center" style={{ color: 'var(--color-text-muted)', padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>Инстансы не найдены. Сначала создайте инстанс на главной.</div>
                                )}
                            </div>
                        </div>
                        <div className="create-footer">
                            <button className="btn btn-secondary" onClick={() => setDownloadTarget(null)}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
