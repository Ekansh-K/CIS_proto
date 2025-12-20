import s from '../../pages/events/events.module.scss'
import { useState, useEffect } from 'react'
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
                        <div className={activeTab === 'past' ? s.grid : undefined} style={activeTab !== 'past' ? { display: 'flex', flexDirection: 'column', gap: '40px' } : undefined}>
                            {filteredEvents.map(event => {
                                const isRegistered = registrations.includes(event.id)
                                const now = new Date()
                                const opensAt = event.registration_open_time ? new Date(event.registration_open_time) : null
                                const isRegistrationOpen = !opensAt || now >= opensAt

                                // PAST EVENTS LAYOUT (VERTICAL SIMPLE)
                                if (activeTab === 'past') {
                                    return (
                                        <div key={event.id} className={s.card} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div className={s['card-image']} style={{ width: '100%', height: '300px' }}>
                                                {event.image_url ? (
                                                    <img src={event.image_url} alt={event.title} style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div className={s['no-image']}>CIS Event</div>
                                                )}
                                            </div>
                                            <div className={s['card-content']} style={{ padding: '1rem', width: '100%' }}>
                                                <h3 className={s['card-title']} style={{ marginBottom: '0.5rem' }}>{event.title}</h3>
                                                <span className={s.date} style={{ fontSize: '0.9rem', color: '#888' }}>
                                                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }

                                // UPCOMING / CURRENT EVENTS LAYOUT (HORIZONTAL: POSTER LEFT, CONTENT RIGHT)
                                return (
                                    <div key={event.id} className={s.card} style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', height: 'auto', alignItems: 'start', padding: '1rem' }}>
                                        {/* LEFT: VERTICAL POSTER */}
                                        <div className={s['card-image']} style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
                                            {event.image_url ? (
                                                <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <div className={s['no-image']}>CIS Event</div>
                                            )}
                                        </div>

                                        {/* RIGHT: DETAILS */}
                                        <div className={s['card-content']} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0' }}>
                                            <div>
                                                <h3 className={s['card-title']} style={{ fontSize: '2.5rem', marginBottom: '0.5rem', lineHeight: '1.1' }}>{event.title}</h3>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 2rem', fontSize: '1.1rem', color: '#ccc' }}>
                                                <span style={{ fontWeight: 'bold' }}>Date :</span>
                                                <span>{event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}</span>

                                                {event.event_time && (
                                                    <>
                                                        <span style={{ fontWeight: 'bold' }}>Time :</span>
                                                        <span>{event.event_time}</span>
                                                    </>
                                                )}

                                                {event.venue && (
                                                    <>
                                                        <span style={{ fontWeight: 'bold', marginTop: '1rem' }}>Venue</span>
                                                        <span style={{ marginTop: '1rem' }}>{event.venue}</span>
                                                    </>
                                                )}

                                                <span style={{ fontWeight: 'bold', marginTop: '1rem' }}>Registration</span>
                                                <span style={{ marginTop: '1rem', textTransform: 'capitalize', color: event.registration_status === 'open' ? '#4caf50' : '#f44336' }}>
                                                    {event.registration_status}
                                                </span>
                                            </div>

                                            {/* COUNTDOWN / REGISTRATION */}
                                            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                                                {!isRegistrationOpen && opensAt ? (
                                                    <div style={{ color: '#ebc034', fontWeight: 'bold', fontSize: '1.2rem', padding: '1rem', border: '1px solid #ebc034', borderRadius: '8px', display: 'inline-block' }}>
                                                        Opens in: <Countdown targetDate={opensAt} />
                                                    </div>
                                                ) : (
                                                    activeTab !== 'past' && event.registration_status !== 'closed' && (
                                                        <div className={s.actions}>
                                                            {event.registration_link ? (
                                                                <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className={s.btn} style={{ fontSize: '1.1rem', padding: '12px 24px' }}>
                                                                    Register Now ↗
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    className={cn(s.btn, isRegistered && s.registered)}
                                                                    onClick={() => !isRegistered && onRegister(event)}
                                                                    disabled={isRegistered}
                                                                    style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                                                                >
                                                                    {isRegistered ? 'Registered ✓' : 'Register'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                            </div>
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

const Countdown = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const diff = targetDate - now

            if (diff <= 0) {
                setTimeLeft('Now')
                clearInterval(interval)
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }, 1000)

        // Initial set
        const now = new Date()
        const diff = targetDate - now
        if (diff <= 0) {
            setTimeLeft('Now')
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }

        return () => clearInterval(interval)
    }, [targetDate])

    return <span>{timeLeft}</span>
}
