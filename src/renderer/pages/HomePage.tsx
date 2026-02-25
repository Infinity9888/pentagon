import React, { useState, useEffect } from 'react';
import { type PageId } from '../App';
import './HomePage.css';

interface HomePageProps {
    onNavigate: (page: PageId) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
    const [newsTab, setNewsTab] = useState<'minecraft' | 'changelog'>('minecraft');
    const [mcNews, setMcNews] = useState<any[]>([]);
    const [ghReleases, setGhReleases] = useState<any[]>([]);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                // Fetch Minecraft News
                const mcData = await window.pentagon?.news?.getMinecraft?.();
                setMcNews(mcData || []);

                // Fetch GitHub Releases
                const ghData = await window.pentagon?.news?.getGitHub?.();
                if (ghData) {
                    setGhReleases(ghData.releases || []);
                    setUpdateAvailable(ghData.updateAvailable || false);
                }
            } catch (err) {
                console.error('Failed to fetch news', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <div className="home-page">
            {/* Hero section */}
            <section className="hero animate-fade-in-up" style={{ paddingBottom: '2rem' }}>
                <div className="hero-text">
                    <h1 className="hero-title">
                        <span className="hero-gradient">Pentagon</span>
                    </h1>
                    <p className="hero-subtitle">Minecraft Launcher нового поколения</p>
                </div>

                <div className="hero-actions">
                    <button
                        className="btn btn-primary btn-lg animate-glow"
                        onClick={() => onNavigate('instances')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Играть
                    </button>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => onNavigate('instances')}
                    >
                        Создать инстанс
                    </button>
                </div>
            </section>

            {/* News Section */}
            <section className="news-section animate-fade-in-up stagger-child" style={{ padding: '0 4rem 4rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <div className="news-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="content-tabs" style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
                        <button
                            className={`tab ${newsTab === 'minecraft' ? 'active' : ''}`}
                            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: newsTab === 'minecraft' ? 'var(--color-surface)' : 'transparent', color: newsTab === 'minecraft' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                            onClick={() => setNewsTab('minecraft')}
                        >
                            Minecraft News
                        </button>
                        <button
                            className={`tab ${newsTab === 'changelog' ? 'active' : ''}`}
                            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: newsTab === 'changelog' ? 'var(--color-surface)' : 'transparent', color: newsTab === 'changelog' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                            onClick={() => setNewsTab('changelog')}
                        >
                            Обновления Лаунчера
                        </button>
                    </div>

                    {updateAvailable && (
                        <button className="btn btn-primary animate-glow" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Скачать обновление
                        </button>
                    )}
                </div>

                <div className="news-feed custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '1rem' }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: '4rem 0', color: 'var(--color-text-muted)' }}>Загрузка новостей...</div>
                    ) : newsTab === 'minecraft' ? (
                        mcNews.length > 0 ? mcNews.map((article, i) => (
                            <div key={i} className="news-card" style={{ display: 'flex', gap: '1.5rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => window.open(article.url, '_blank')}>
                                {article.imageUrl ? (
                                    <img src={article.imageUrl} alt={article.title} style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                                ) : (
                                    <div style={{ width: '160px', height: '90px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>No Image</div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{article.category} • {new Date(article.date).toLocaleDateString()}</div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{article.title}</h3>
                                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.description}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state" style={{ padding: '4rem 0', color: 'var(--color-text-muted)' }}>Нет новостей Minecraft</div>
                        )
                    ) : (
                        ghReleases.length > 0 ? ghReleases.map((release, i) => (
                            <div key={i} className="news-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{release.name}</h3>
                                            <span style={{ background: 'var(--color-primary-alpha)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>v{release.version}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(release.date).toLocaleDateString()}</div>
                                    </div>
                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => window.open(release.url, '_blank')}>GitHub</button>
                                </div>
                                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{release.body}</p>
                            </div>
                        )) : (
                            <div className="empty-state" style={{ padding: '4rem 0', color: 'var(--color-text-muted)' }}>Нет обновлений лаунчера</div>
                        )
                    )}
                </div>
            </section>
        </div>
    );
}
