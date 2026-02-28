import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import './SettingsPage.css';

export default function SettingsPage() {
    const { t, setLanguage } = useTranslation();
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        window.pentagon.settings.get().then(setSettings).catch(console.error);
    }, []);

    const handleChange = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        window.pentagon.settings.set({ [key]: value }).catch(console.error);

        if (key === 'theme') {
            document.documentElement.setAttribute('data-theme', value);
        } else if (key === 'language') {
            setLanguage(value);
        }
    };

    if (!settings) {
        return <div className="page settings-page"><div className="page-header"><h2>{t('mods.downloading')}</h2></div></div>;
    }

    return (
        <div className="page settings-page animate-fade-in">
            <div className="page-header">
                <h2 className="page-title">{t('settings.title')}</h2>
            </div>

            <div className="settings-sections">
                {/* Java */}
                <section className="settings-section">
                    <h3 className="settings-section-title">{t('settings.javaMemory')}</h3>
                    <div className="settings-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>{t('settings.javaPath')}</label>
                                <span className="setting-hint">{settings.javaPath || t('settings.autoDetect')}</span>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={async () => {
                                    const path = await window.pentagon.settings.selectJavaPath();
                                    if (path) handleChange('javaPath', path);
                                }}
                            >
                                {t('settings.select')}
                            </button>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>{t('settings.maxRam')}</label>
                                <span className="setting-hint">{t('settings.ramHint')}</span>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="1024" max="16384" step="512"
                                    value={settings.maxRam}
                                    onChange={e => handleChange('maxRam', Number(e.target.value))}
                                    className="range-input"
                                />
                                <span className="setting-value">{settings.maxRam} МБ</span>
                            </div>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>{t('settings.jvmArgs')}</label>
                                <span className="setting-hint">{t('settings.jvmHint')}</span>
                            </div>
                            <input
                                type="text"
                                className="input input-sm"
                                value={settings.jvmArgs}
                                onChange={e => handleChange('jvmArgs', e.target.value)}
                                placeholder="-XX:+UseG1GC"
                            />
                        </div>
                    </div>
                </section>

                {/* Appearance */}
                <section className="settings-section">
                    <h3 className="settings-section-title">{t('settings.appearance')}</h3>
                    <div className="settings-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>{t('settings.language')}</label>
                            </div>
                            <div className="theme-switcher">
                                <button
                                    className={`theme-btn ${settings.language === 'ru' ? 'active' : ''}`}
                                    onClick={() => handleChange('language', 'ru')}
                                >{t('settings.ru')}</button>
                                <button
                                    className={`theme-btn ${settings.language === 'en' ? 'active' : ''}`}
                                    onClick={() => handleChange('language', 'en')}
                                >{t('settings.en')}</button>
                            </div>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>{t('settings.theme')}</label>
                            </div>
                            <div className="theme-switcher">
                                <button
                                    className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => handleChange('theme', 'dark')}
                                >{t('settings.dark')}</button>
                                <button
                                    className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                                    onClick={() => handleChange('theme', 'light')}
                                >{t('settings.light')}</button>
                                <button
                                    className={`theme-btn ${settings.theme === 'cream' ? 'active' : ''}`}
                                    onClick={() => handleChange('theme', 'cream')}
                                >{t('settings.cream')}</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Launch */}
                <section className="settings-section">
                    <h3 className="settings-section-title">{t('settings.launch')}</h3>
                    <div className="settings-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>{t('settings.showConsole')}</label>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.showConsole}
                                    onChange={e => handleChange('showConsole', e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
