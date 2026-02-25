import { useState, useEffect } from 'react';
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

    useEffect(() => {
        window.pentagon.settings.get().then((settings: any) => {
            if (settings && settings.theme) {
                document.documentElement.setAttribute('data-theme', settings.theme);
            }
        }).catch(console.error);
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

    return (
        <div className="app">
            <TitleBar />
            <div className="app-body">
                <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
                <main className="app-content">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}
