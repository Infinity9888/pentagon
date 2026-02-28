import { useState, useEffect } from 'react';
import VersionView from './instance-config/VersionView';
import ModsView from './instance-config/ModsView';
import ModpackView from './instance-config/ModpackView';
import ConsoleView from './instance-config/ConsoleView';
import ServersView from './instance-config/ServersView';
import SettingsView from './instance-config/SettingsView';
import { useTranslation } from '../i18n';
import './InstanceConfigModal.css';

interface InstanceConfigModalProps {
    instanceId: string;
    onClose: () => void;
}

export default function InstanceConfigModal({ instanceId, onClose }: InstanceConfigModalProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('version');
    const [instanceName, setInstanceName] = useState(instanceId);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Mock tabs for now
    const tabs = [
        { id: 'version', label: t('instances.config.version'), icon: '📦' },
        { id: 'mods', label: t('instances.config.mods'), icon: '🧩' },
        { id: 'resourcepacks', label: t('instances.config.resourcePacks'), icon: '🎨' },
        { id: 'shaders', label: t('instances.config.shaders'), icon: '✨' },
        { id: 'servers', label: t('instances.config.servers'), icon: '🌐' },
        { id: 'modpack', label: t('instances.config.modpack'), icon: '📚' },
        { id: 'console', label: t('instances.config.console'), icon: '📝' },
        { id: 'settings', label: t('instances.config.settings'), icon: '⚙️' },
    ];

    return (
        <div className="modal-backdrop animate-fade-in">
            <div className="instance-config-modal animate-slide-up">
                {/* Header */}
                <div className="config-header">
                    <div className="config-header-title">
                        <img src="https://minecraft.wiki/images/Crafting_Table_JE4_BE3.png" alt="Icon" className="title-icon" />
                        <h2>{t('instances.config.title')} {instanceName}</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} title={t('instances.config.close')}>
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
                        {activeTab === 'modpack' && <ModpackView instanceId={instanceId} />}
                        {activeTab === 'console' && <ConsoleView instanceId={instanceId} />}

                        {activeTab === 'resourcepacks' && (
                            <div className="view-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3>{t('instances.config.resourcePacks')}</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{t('instances.config.manageResourcePacks')}</p>
                                <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'resourcepacks')}>{t('instances.config.openResourcePacks')}</button>
                            </div>
                        )}
                        {activeTab === 'shaders' && (
                            <div className="view-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3>{t('instances.config.shaders')}</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{t('instances.config.manageShaders')}</p>
                                <button className="btn btn-secondary" onClick={() => window.pentagon?.instances?.openFolder?.(instanceId, 'shaderpacks')}>{t('instances.config.openShaders')}</button>
                            </div>
                        )}
                        {activeTab === 'servers' && (
                            <ServersView instanceId={instanceId} />
                        )}
                        {activeTab === 'settings' && (
                            <SettingsView instanceId={instanceId} />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="config-footer">
                    <button className="btn btn-secondary" onClick={onClose}>{t('instances.config.close')}</button>
                    <button className="btn btn-primary" onClick={() => alert('Launch game from config not yet implemented')}>{t('instances.config.launch')}</button>
                </div>
            </div>
        </div>
    );
}
