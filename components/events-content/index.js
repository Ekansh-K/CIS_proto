import s from '../../pages/events/events.module.scss'
import cn from 'clsx'
import dynamic from 'next/dynamic'

const Sun = dynamic(() => import('icons/sun.svg'), { ssr: false })
const Moon = dynamic(() => import('icons/moon.svg'), { ssr: false })
const Arrow = dynamic(() => import('icons/arrow-buttons.svg'), { ssr: false })

export const EventsContent = ({ theme, toggleTheme, goBack, activeTab, setActiveTab, events = [], user, registrations = [], onRegister, onLogin, onLogout }) => {

    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'current', label: 'Current' },
        { id: 'past', label: 'Past' },
    ]

    const filteredEvents = events.filter(e => e.category === activeTab)

    return (
        <div className={cn(s.events, theme === 'dark' && s.dark)} style={{ minHeight: '100vh', paddingTop: '200px' }}>
            <div className={s.inner}>
                <div className={s['header-row']}>
                    <div className={s.left}>
                        <div className={s['title-col']}>
                            <button className={s['back-btn']} onClick={goBack} aria-label="Go Back">
                                <Arrow />
                            </button>
                            <h1 className={s.title}>Events</h1>
                        </div>
                    </div>

                    <div className={s.right} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {user ? (
                            <div className={s.userProfile} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '10px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                                </span>
                                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                                    {user.email}
                                </span>
                                <button className={s.authBtn} onClick={onLogout} style={{ fontSize: '12px', padding: '4px 8px', marginTop: '4px' }}>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button className={s.authBtn} onClick={onLogin}>
                                Login
                            </button>
                        )}
                        <button className={s['theme-toggle']} onClick={toggleTheme} aria-label="Toggle Dark Mode">
                            {theme === 'light' ? <Moon /> : <Sun />}
                        </button>
                    </div>
                </div>

                <div className={s.tabs}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={cn(activeTab === tab.id && s.active)}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={s.content}>
                    {filteredEvents.length === 0 ? (
                        <div className={s.placeholder}>
                            {activeTab === 'upcoming' && 'No upcoming events scheduled yet.'}
                            {activeTab === 'current' && 'No events currently happening.'}
                            {activeTab === 'past' && 'Archive of past events will appear here.'}
                        </div>
                    ) : (
                        <div className={s.grid}>
                            {filteredEvents.map(event => {
                                const isRegistered = registrations.includes(event.id)
                                return (
                                    <div key={event.id} className={s.card}>
                                        <div className={s['card-image']}>
                                            {event.image_url ? (
                                                <img src={event.image_url} alt={event.title} />
                                            ) : (
                                                <div className={s['no-image']}>CIS Event</div>
                                            )}
                                            {/* Status Badge */}
                                            {event.registration_status === 'closed' && (
                                                <div className={s.badge}>Closed</div>
                                            )}
                                        </div>
                                        <div className={s['card-content']}>
                                            <span className={s.date}>
                                                {event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}
                                            </span>
                                            <h3 className={s['card-title']}>{event.title}</h3>
                                            <p className={s.desc}>{event.description}</p>

                                            {activeTab !== 'past' && event.registration_status !== 'closed' && (
                                                <div className={s.actions}>
                                                    {event.registration_link ? (
                                                        <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className={s.btn}>
                                                            Register Now ↗
                                                        </a>
                                                    ) : (
                                                        <button
                                                            className={cn(s.btn, isRegistered && s.registered)}
                                                            onClick={() => !isRegistered && onRegister(event)}
                                                            disabled={isRegistered}
                                                        >
                                                            {isRegistered ? 'Registered ✓' : 'Register'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
