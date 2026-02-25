import { useState, useEffect } from 'react';
import './SettingsPage.css';

export default function SettingsPage() {
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
        }
    };

    if (!settings) {
        return <div className="page settings-page"><div className="page-header"><h2>Загрузка...</h2></div></div>;
    }

    return (
        <div className="page settings-page animate-fade-in">
            <div className="page-header">
                <h2 className="page-title">Настройки</h2>
            </div>

            <div className="settings-sections">
                {/* Java */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Java & Память</h3>
                    <div className="settings-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>Путь к Java</label>
                                <span className="setting-hint">{settings.javaPath || 'Автоматически определяется'}</span>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={async () => {
                                    const path = await window.pentagon.settings.selectJavaPath();
                                    if (path) handleChange('javaPath', path);
                                }}
                            >
                                Выбрать
                            </button>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>Максимальная память (RAM)</label>
                                <span className="setting-hint">Рекомендуется 4-8 ГБ для модов</span>
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
                                <label>Аргументы JVM</label>
                                <span className="setting-hint">Дополнительные параметры запуска</span>
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
                    <h3 className="settings-section-title">Внешний вид</h3>
                    <div className="settings-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>Тема</label>
                            </div>
                            <div className="theme-switcher">
                                <button
                                    className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => handleChange('theme', 'dark')}
                                >Тёмная</button>
                                <button
                                    className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                                    onClick={() => handleChange('theme', 'light')}
                                >Светлая</button>
                                <button
                                    className={`theme-btn ${settings.theme === 'cream' ? 'active' : ''}`}
                                    onClick={() => handleChange('theme', 'cream')}
                                >Кремовая</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Launch */}
                <section className="settings-section">
                    <h3 className="settings-section-title">Запуск</h3>
                    <div className="settings-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <label>Показывать консоль</label>
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
