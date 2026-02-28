import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';

interface SettingsViewProps {
    instanceId: string;
}

export default function SettingsView({ instanceId }: SettingsViewProps) {
    const { t } = useTranslation();
    const [config, setConfig] = useState<any>(null);
    const [minMem, setMinMem] = useState<number>(1024);
    const [maxMem, setMaxMem] = useState<number>(4096);
    const [javaPath, setJavaPath] = useState<string>('');
    const [jvmArgs, setJvmArgs] = useState<string>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        window.pentagon.instances.getConfig(instanceId).then((data: any) => {
            setConfig(data);
            if (data?.javaSettings) {
                setMinMem(data.javaSettings.minMemory || 1024);
                setMaxMem(data.javaSettings.maxMemory || 4096);
                setJavaPath(data.javaSettings.javaPath || '');
                setJvmArgs(data.javaSettings.jvmArguments || '');
            }
        });
    }, [instanceId]);

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const newConfig = {
                ...config,
                javaSettings: {
                    minMemory: minMem,
                    maxMemory: maxMem,
                    javaPath: javaPath,
                    jvmArguments: jvmArgs
                }
            };
            await window.pentagon.instances.updateConfig(instanceId, newConfig);
            // Flash success state
            const btn = document.getElementById('save-instance-btn');
            if (btn) {
                const oldText = btn.innerText;
                btn.innerText = t('instances.config.settings.saved');
                setTimeout(() => btn.innerText = oldText, 2000);
            }
        } catch (e) {
            console.error('Failed to save config:', e);
            alert('Failed to save instance settings.');
        } finally {
            setSaving(false);
        }
    };

    if (!config) {
        return <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>{t('instances.config.loading')}</div>;
    }

    return (
        <div className="config-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="view-header">
                <h3>{t('instances.config.settings.title')}</h3>
                <p>{t('instances.config.settings.desc')}</p>
            </div>

            <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}>
                <div className="settings-section">
                    <h4>{t('instances.config.settings.memory')}</h4>
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t('instances.config.settings.minMem')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={minMem}
                                onChange={e => setMinMem(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t('instances.config.settings.maxMem')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={maxMem}
                                onChange={e => setMaxMem(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h4>{t('instances.config.settings.java')}</h4>
                    <div className="form-group">
                        <label>{t('instances.config.settings.javaPath')}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="/path/to/javaw.exe"
                            value={javaPath}
                            onChange={e => setJavaPath(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('instances.config.settings.jvmArgs')}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="-XX:+UseG1GC"
                            value={jvmArgs}
                            onChange={e => setJvmArgs(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>

                <div className="settings-section" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                    <button id="save-instance-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? t('instances.config.settings.saving') : t('instances.config.settings.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
