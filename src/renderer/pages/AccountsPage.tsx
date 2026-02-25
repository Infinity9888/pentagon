import { useState, useEffect } from 'react';
import './AccountsPage.css';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [defaultId, setDefaultId] = useState<string | null>(null);
    const [showOfflineForm, setShowOfflineForm] = useState(false);
    const [offlineUsername, setOfflineUsername] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const data = await window.pentagon?.auth?.getAccounts();
            if (data) {
                setAccounts(data.accounts || []);
                setDefaultId(data.defaultId || null);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const handleOfflineLogin = async () => {
        if (offlineUsername.trim()) {
            setIsLoggingIn(true);
            try {
                await window.pentagon?.auth?.loginOffline(offlineUsername.trim());
                setOfflineUsername('');
                setShowOfflineForm(false);
                await fetchAccounts();
            } catch (error) {
                console.error('Offline login failed:', error);
            } finally {
                setIsLoggingIn(false);
            }
        }
    };

    const handleMSALogin = async () => {
        setIsLoggingIn(true);
        try {
            await window.pentagon?.auth?.loginMSA();
            await fetchAccounts();
        } catch (error) {
            console.error('MSA login failed:', error);
            // Optionally show error to user here
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRemoveAccount = async (id: string) => {
        await window.pentagon?.auth?.removeAccount(id);
        await fetchAccounts();
    };

    const handleSetDefault = async (id: string) => {
        await window.pentagon?.auth?.setDefault(id);
        await fetchAccounts();
    };

    return (
        <div className="page accounts-page animate-fade-in">
            <div className="page-header">
                <h2 className="page-title">Аккаунты</h2>
            </div>

            <div className="accounts-actions">
                <button
                    className="btn btn-primary"
                    onClick={handleMSALogin}
                    disabled={isLoggingIn}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M0 0h11.377v11.377H0zm12.623 0H24v11.377H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z" />
                    </svg>
                    {isLoggingIn ? 'Авторизация...' : 'Войти через Microsoft'}
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowOfflineForm(!showOfflineForm)}
                    disabled={isLoggingIn}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Офлайн режим
                </button>
            </div>

            {showOfflineForm && (
                <div className="offline-form animate-fade-in-up">
                    <input
                        type="text"
                        className="input"
                        placeholder="Имя игрока..."
                        value={offlineUsername}
                        onChange={(e) => setOfflineUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleOfflineLogin()}
                        maxLength={16}
                        autoFocus
                        disabled={isLoggingIn}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleOfflineLogin}
                        disabled={!offlineUsername.trim() || isLoggingIn}
                    >
                        Добавить
                    </button>
                </div>
            )}

            <div className="accounts-list">
                {accounts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h3>Нет аккаунтов</h3>
                        <p>Добавьте Microsoft или офлайн аккаунт для игры</p>
                    </div>
                ) : (
                    <div className="accounts-list-compact" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {accounts.map(acc => (
                            <div
                                key={acc.internalId}
                                className={`account-row animate-fade-in-up ${acc.internalId === defaultId ? 'active-row' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-3)',
                                    background: acc.internalId === defaultId ? 'var(--color-surface-active)' : 'var(--color-surface)',
                                    border: `1px solid ${acc.internalId === defaultId ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-md)'
                                }}
                            >
                                <div className="account-row-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        {acc.profile?.name || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                        {acc.type === 'msa' ? 'Microsoft' : 'Offline'}
                                    </div>
                                    {acc.internalId === defaultId && (
                                        <div style={{ fontSize: '10px', background: 'var(--color-accent)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                            Текущий
                                        </div>
                                    )}
                                </div>
                                <div className="account-row-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    {acc.internalId !== defaultId && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: 'var(--space-1) var(--space-3)', fontSize: '13px' }}
                                            onClick={() => handleSetDefault(acc.internalId)}
                                        >
                                            Выбрать
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-secondary text-error hover-action"
                                        style={{ padding: 'var(--space-1) var(--space-3)', fontSize: '13px' }}
                                        onClick={() => handleRemoveAccount(acc.internalId)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
