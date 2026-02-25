import { useState, useEffect } from 'react';
import VersionView from './instance-config/VersionView';
import ModsView from './instance-config/ModsView';
import ModrinthView from './instance-config/ModrinthView';
import ConsoleView from './instance-config/ConsoleView';
import './InstanceConfigModal.css';

interface InstanceConfigModalProps {
    instanceId: string;
    onClose: () => void;
}

export default function InstanceConfigModal({ instanceId, onClose }: InstanceConfigModalProps) {
    const [activeTab, setActiveTab] = useState('version');
    const [instanceName, setInstanceName] = useState(instanceId);

    // Mock tabs for now
    const tabs = [
        { id: 'version', label: 'Version', icon: '📦' },
        { id: 'mods', label: 'Mods', icon: '🧩' },
        { id: 'resourcepacks', label: 'Resource Packs', icon: '🎨' },
        { id: 'shaders', label: 'Shaders', icon: '✨' },
        { id: 'servers', label: 'Servers', icon: '🌐' },
        { id: 'modrinth', label: 'Modrinth', icon: '🟢' },
        { id: 'console', label: 'Minecraft Log', icon: '📝' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="modal-backdrop animate-fade-in">
            <div className="instance-config-modal animate-slide-up">
                {/* Header */}
                <div className="config-header">
                    <div className="config-header-title">
                        <img src="https://minecraft.wiki/images/Crafting_Table_JE4_BE3.png" alt="Icon" className="title-icon" />
                        <h2>Configuration for {instanceName}</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="config-body">
                    {/* Sidebar */}
                    <div className="config-sidebar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`config-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="config-sidebar-icon">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="config-content">
                        {activeTab === 'version' && <VersionView instanceId={instanceId} />}
                        {activeTab === 'mods' && <ModsView instanceId={instanceId} />}
                        {activeTab === 'modrinth' && <ModrinthView instanceId={instanceId} />}
                        {activeTab === 'console' && <ConsoleView instanceId={instanceId} />}

                        {activeTab === 'resourcepacks' && (
                            <div className="view-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3>Resource Packs</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Manage resource packs for this instance.</p>
                                <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'resourcepacks')}>Open resourcepacks folder</button>
                            </div>
                        )}
                        {activeTab === 'shaders' && (
                            <div className="view-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3>Shader Packs</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Manage OptiFine/Iris shader packs for this instance.</p>
                                <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'shaderpacks')}>Open shaderpacks folder</button>
                            </div>
                        )}
                        {activeTab === 'servers' && (
                            <div className="view-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3>Servers</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Manage the servers.dat file for this instance.</p>
                                <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId)}>Open instance folder</button>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="view-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3>Instance Settings</h3>
                                <p style={{ color: 'var(--color-text-muted)' }}>Override global memory or Java settings specifically for this instance.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="config-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={() => alert('Launch game from config not yet implemented')}>Launch</button>
                </div>
            </div>
        </div>
    );
}
