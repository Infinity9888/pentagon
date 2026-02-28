import { useState, useEffect, useRef } from 'react';
import TitleBar from './components/layout/TitleBar';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import InstancesPage from './pages/InstancesPage';
import ModsPage from './pages/ModsPage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

export type PageId = 'home' | 'instances' | 'mods' | 'accounts' | 'settings';

export default function App() {
    const [currentPage, setCurrentPage] = useState<PageId>('home');
    const [isDragging, setIsDragging] = useState(false);
    const [deepLinkData, setDeepLinkData] = useState<{ provider: string, addonId?: string, fileId?: string, rawUrl?: string } | null>(null);
    const [isInstallingModpack, setIsInstallingModpack] = useState(false);
    const [modpackProgress, setModpackProgress] = useState({ message: '', percent: 0 });
    const dragCounter = useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const files = Array.from(e.dataTransfer.files)
            .map(f => window.pentagon?.utils?.getPathForFile?.(f) || (f as any).path)
            .filter(Boolean);

        if (files.length === 0) return;

        // Try to get the active/last used instance. If none, maybe open instances page?
        // Wait, the user should be on the Instances or Mods page ideally, or we install to the "active" instance.
        // Let's just ask the main process to handle it, giving it the list of files.
        try {
            await window.pentagon?.instances?.installLocalFiles?.(files);
            // Optionally show a success toast here if we had a toast system
            console.log('Files sent to main process for installation');
        } catch (err) {
            console.error('Failed to install dropped files', err);
            alert(`Error installing files: ${err}`); // Fallback
        }
    };

    useEffect(() => {
        window.pentagon.settings.get().then((settings: any) => {
            if (settings && settings.theme) {
                document.documentElement.setAttribute('data-theme', settings.theme);
            }
        }).catch(console.error);

        // Listen for deep links
        const removeOpenUrlListener = window.pentagon?.app?.onOpenUrl?.((url: string) => {
            console.log('Received Deep Link URL:', url);
            if (url.startsWith('curseforge://install')) {
                const params = new URLSearchParams(url.split('?')[1] || "");
                setDeepLinkData({
                    provider: 'curseforge',
                    addonId: params.get('addonId') || undefined,
                    fileId: params.get('fileId') || undefined,
                    rawUrl: url
                });
            } else if (url.startsWith('modrinth://')) {
                setDeepLinkData({
                    provider: 'modrinth',
                    rawUrl: url
                });
            } else {
                setDeepLinkData({
                    provider: 'pentagon',
                    rawUrl: url
                });
            }
        });

        return () => {
            if (removeOpenUrlListener) removeOpenUrlListener();
        };
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <HomePage onNavigate={setCurrentPage} />;
            case 'instances': return <InstancesPage />;
            case 'mods': return <ModsPage />;
            case 'accounts': return <AccountsPage />;
            case 'settings': return <SettingsPage />;
            default: return <HomePage onNavigate={setCurrentPage} />;
        }
    };

    const handleInstallModpack = async () => {
        if (!deepLinkData || !deepLinkData.addonId || !deepLinkData.fileId || deepLinkData.provider !== 'curseforge') return;

        setIsInstallingModpack(true);
        setModpackProgress({ message: 'Подготовка...', percent: 0 });

        const removeListener = window.pentagon?.mods?.onInstallProgress?.((data: any) => {
            if (data.modId === deepLinkData.addonId) {
                setModpackProgress({ message: data.message, percent: data.percent || 0 });
            }
        });

        try {
            const res = await window.pentagon?.instances?.createCFModpack?.(deepLinkData.addonId, deepLinkData.fileId);
            if (res && res.success) {
                setDeepLinkData(null);
                setCurrentPage('instances');
            } else {
                alert(`Ошибка установки сборки: ${res?.error}`);
            }
        } catch (e: any) {
            alert(`Ошибка: ${e.message}`);
        } finally {
            setIsInstallingModpack(false);
            if (removeListener) removeListener();
        }
    };

    return (
        <div
            className="app"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <TitleBar />
            <div className="app-body">
                <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
                <main className="app-content">
                    {renderPage()}
                </main>
            </div>
            {isDragging && (
                <div className="drag-overlay">
                    <div className="drag-content">
                        <div className="drag-icon">📥</div>
                        <h2>Drop files to install</h2>
                        <p>Mod .jar files will be installed to the active instance</p>
                    </div>
                </div>
            )}

            {deepLinkData && (
                <div className="modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
                    <div className="modal-window animate-slide-up" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ marginBottom: '1rem' }}>📥 Распознана внешняя ссылка</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Лаунчер перехватил запрос на установку с <strong>{deepLinkData.provider}</strong>.
                        </p>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
                            {deepLinkData.rawUrl}
                        </div>
                        {deepLinkData.addonId && (
                            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                <strong>Project ID:</strong> {deepLinkData.addonId} <br />
                                {deepLinkData.fileId && <span><strong>File ID:</strong> {deepLinkData.fileId}</span>}
                            </div>
                        )}

                        {isInstallingModpack ? (
                            <div style={{ marginTop: '2rem' }}>
                                <p style={{ marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.95rem' }}>{modpackProgress.message}</p>
                                <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${modpackProgress.percent}%`, height: '100%', background: 'var(--brand-primary)', transition: 'width 0.3s ease' }}></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {deepLinkData.provider === 'curseforge' && deepLinkData.addonId && deepLinkData.fileId ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                        Нажмите "Установить сборку", чтобы скачать и настроить её автоматически!
                                    </p>
                                ) : (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                        Эта ссылка не содержит полного ID файла сборки. Поддержка других форматов ссылок появится позже.
                                    </p>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button className="btn btn-secondary" disabled={isInstallingModpack} onClick={() => setDeepLinkData(null)}>Отмена</button>
                                    {deepLinkData.provider === 'curseforge' && deepLinkData.addonId && deepLinkData.fileId && (
                                        <button className="btn btn-primary" onClick={handleInstallModpack}>Установить сборку</button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
