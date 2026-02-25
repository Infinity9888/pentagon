import { useState, useEffect } from 'react';
import './CreateInstanceModal.css';

interface CreateInstanceModalProps {
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateInstanceModal({ onClose, onCreated }: CreateInstanceModalProps) {
    const [name, setName] = useState('');
    const [activeTab, setActiveTab] = useState('vanilla');

    // Version fetching state
    const [mcVersions, setMcVersions] = useState<any[]>([]);
    const [fabricVersions, setFabricVersions] = useState<any[]>([]);

    // Selected state
    const [selectedMc, setSelectedMc] = useState('');
    const [selectedLoaderType, setSelectedLoaderType] = useState<'vanilla' | 'fabric' | 'forge'>('vanilla');
    const [selectedFabric, setSelectedFabric] = useState('');
    const [selectedForge, setSelectedForge] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    // Modrinth search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPack, setSelectedPack] = useState<any>(null);

    useEffect(() => {
        // Fetch Minecraft versions
        window.pentagon?.versions?.getMinecraft?.()
            .then((versions: any) => {
                const releases = versions.filter((v: any) => v.type === 'release');
                setMcVersions(releases);
                if (releases.length > 0) setSelectedMc(releases[0].id);
                setLoading(false);
            })
            .catch((e: any) => {
                setError('Failed to fetch Minecraft versions');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!selectedMc || activeTab !== 'vanilla') return;

        window.pentagon?.versions?.getFabric?.(selectedMc)
            .then((versions: any) => {
                setFabricVersions(versions || []);
                if (versions && versions.length > 0) {
                    setSelectedFabric(versions[0].version);
                } else {
                    setSelectedFabric('');
                }
            })
            .catch(() => {
                setFabricVersions([]);
                setSelectedFabric('');
            });

        // We will wire up forge versions later, for now just clear them
        // TODO: window.pentagon.versions.getForge(selectedMc)
    }, [selectedMc, activeTab]);

    const handleSearchModrinth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await window.pentagon?.mods?.search?.(searchQuery, 'modpack');
            setSearchResults(res?.hits || []);
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Please enter an instance name');
            return;
        }

        if (activeTab === 'modrinth' && !selectedPack) {
            setError('Please select a modpack to install');
            return;
        }

        setCreating(true);
        setError('');

        try {
            const config = {
                name: name.trim(),
                version: {
                    minecraft: selectedMc,
                    ...(selectedLoaderType === 'fabric' && selectedFabric && { fabric: selectedFabric }),
                    ...(selectedLoaderType === 'forge' && selectedForge && { forge: selectedForge })
                }
            };

            const res = await window.pentagon?.instances?.create?.(config);

            if (res && res.success) {
                onCreated();
                onClose();
            } else {
                setError(res?.error || 'Failed to create instance');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="modal-backdrop animate-fade-in">
            <div className="create-modal animate-slide-up">
                <div className="create-header">
                    <h2>Add Instance</h2>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="create-tabs">
                    <button className={`tab-btn ${activeTab === 'vanilla' ? 'active' : ''}`} onClick={() => setActiveTab('vanilla')}>
                        Vanilla / Custom
                    </button>
                    <button className={`tab-btn ${activeTab === 'modrinth' ? 'active' : ''}`} onClick={() => setActiveTab('modrinth')}>
                        Modrinth
                    </button>
                    <button className={`tab-btn ${activeTab === 'curseforge' ? 'active' : ''}`} onClick={() => setActiveTab('curseforge')}>
                        CurseForge
                    </button>
                </div>

                <div className="create-body">
                    {error && <div className="error-banner">{error}</div>}

                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="My Awesome Assembly"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {activeTab === 'vanilla' && (
                        <div className="version-selectors">
                            <div className="form-group">
                                <label>Minecraft Version</label>
                                {loading ? (
                                    <select className="form-select" disabled><option>Loading...</option></select>
                                ) : (
                                    <select className="form-select" value={selectedMc} onChange={e => setSelectedMc(e.target.value)}>
                                        {mcVersions.map(v => (
                                            <option key={v.id} value={v.id}>{v.id}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Mod Loader</label>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                                    <button
                                        className={`btn ${selectedLoaderType === 'vanilla' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setSelectedLoaderType('vanilla')}
                                        style={{ flex: 1 }}
                                    >
                                        Vanilla
                                    </button>
                                    <button
                                        className={`btn ${selectedLoaderType === 'fabric' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setSelectedLoaderType('fabric')}
                                        style={{ flex: 1 }}
                                    >
                                        Fabric
                                    </button>
                                    <button
                                        className={`btn ${selectedLoaderType === 'forge' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setSelectedLoaderType('forge')}
                                        // disabled={true} // Add this if forge is not implemented yet in backend
                                        style={{ flex: 1 }}
                                    >
                                        Forge
                                    </button>
                                </div>
                            </div>

                            {selectedLoaderType === 'fabric' && (
                                <div className="form-group animate-slide-up" style={{ animationDuration: '0.2s' }}>
                                    <label>Fabric Version</label>
                                    <select className="form-select" value={selectedFabric} onChange={e => setSelectedFabric(e.target.value)} disabled={loading || fabricVersions.length === 0}>
                                        {fabricVersions.map(v => (
                                            <option key={`fab-${v.version}`} value={v.version}>{v.version}</option>
                                        ))}
                                    </select>
                                    {fabricVersions.length === 0 && !loading && <span style={{ fontSize: 12, color: 'var(--color-text-error)', marginTop: 4, display: 'block' }}>No Fabric versions available for this Minecraft version.</span>}
                                </div>
                            )}

                            {selectedLoaderType === 'forge' && (
                                <div className="form-group animate-slide-up" style={{ animationDuration: '0.2s' }}>
                                    <label>Forge Version</label>
                                    <select className="form-select" value={selectedForge} onChange={e => setSelectedForge(e.target.value)} disabled={true}>
                                        <option value="">Fetching Forge versions...</option>
                                    </select>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>Forge backend support is coming soon.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'modrinth' && (
                        <div className="modrinth-search-view animate-fade-in" style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1, maxHeight: '300px' }}>
                            <form onSubmit={handleSearchModrinth} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search Modrinth for modpacks..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="btn btn-primary" disabled={isSearching}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    Search
                                </button>
                            </form>

                            <div className="search-results custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {searchResults.map(result => (
                                    <div
                                        key={result.project_id}
                                        className={`search-result-card ${selectedPack === result.project_id ? 'active' : ''}`}
                                        onClick={() => setSelectedPack(result.project_id)}
                                        style={{
                                            display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)',
                                            background: selectedPack === result.project_id ? 'var(--color-surface-active)' : 'var(--color-bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: `1px solid ${selectedPack === result.project_id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                            cursor: 'pointer', transition: 'var(--transition-colors)'
                                        }}
                                    >
                                        {result.icon_url ? (
                                            <img src={result.icon_url} alt="icon" style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 48, height: 48, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 var(--space-1) 0', color: selectedPack === result.project_id ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>{result.title}</h4>
                                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{result.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && !isSearching && searchQuery && (
                                    <div className="text-center" style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>No modpacks found.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'curseforge' && (
                        <div className="view-placeholder" style={{ marginTop: 'var(--space-4)' }}>
                            <p>CurseForge Search UI goes here.</p>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Will query https://api.curseforge.com/v1/mods/search</span>
                        </div>
                    )}
                </div>

                <div className="create-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={creating}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={creating || loading}>
                        {creating ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
