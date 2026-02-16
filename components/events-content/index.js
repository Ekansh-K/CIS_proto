import s from '../../pages/events/events.module.scss'
import { useState, useEffect } from 'react'
import cn from 'clsx'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useStore } from 'lib/store'

const Sun = dynamic(() => import('icons/sun.svg'), { ssr: false })
const Moon = dynamic(() => import('icons/moon.svg'), { ssr: false })
const Arrow = dynamic(() => import('icons/arrow-buttons.svg'), { ssr: false })
const Logout = dynamic(() => import('icons/logout.svg'), { ssr: false })

export const EventsContent = ({ theme, toggleTheme, goBack, activeTab, setActiveTab, events = [], user, registrations = [], onRegister, onLogin, onLogout }) => {

    const lenis = useStore(({ lenis }) => lenis)

    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'current', label: 'Current' },
        { id: 'past', label: 'Past' },
    ]

    const [notification, setNotification] = useState(null)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    // Track events whose registration has just opened (for real-time status updates)
    const [openedRegistrations, setOpenedRegistrations] = useState({})
    // Force re-render counter when a countdown completes
    const [, forceUpdate] = useState(0)

    // Lock body scroll and stop Lenis when modal is open
    useEffect(() => {
        if (selectedEvent) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
            document.documentElement.classList.add('lenis-stopped')
            lenis?.stop()
        } else {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
            document.documentElement.classList.remove('lenis-stopped')
            lenis?.start()
        }
        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
            document.documentElement.classList.remove('lenis-stopped')
            lenis?.start()
        }
    }, [selectedEvent, lenis])

    const handleLogoutClick = () => {
        setShowLogoutModal(true)
    }

    const confirmLogout = () => {
        setShowLogoutModal(false)
        onLogout()
        setNotification('Logged out successfully')
        setTimeout(() => setNotification(null), 2000)
    }

    const filteredEvents = events
        .filter(e => e.category === activeTab)
        .sort((a, b) => {
            const dateA = new Date(a.date || 0)
            const dateB = new Date(b.date || 0)
            return activeTab === 'past' ? dateB - dateA : dateA - dateB
        })

    return (
        <div className={cn(s.events, theme === 'dark' && s.dark)}>
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

                    <div className={s.right}>

                        {
                            user ? (
                                <>
                                    <div className={s.userProfile}>
                                        <span className={s.userName}>
                                            {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                                        </span>
                                        <span className={s.userEmail}>
                                            {user.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogoutClick}
                                        aria-label="Logout"
                                        className={s['logout-btn']}
                                    >
                                        <Logout />
                                    </button>
                                </>
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

                <div className={s.tabs} role="tablist" aria-label="Event categories">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`tabpanel-${tab.id}`}
                            className={cn(activeTab === tab.id && s.active)}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div
                    className={s.content}
                    role="tabpanel"
                    id={`tabpanel-${activeTab}`}
                    aria-labelledby={activeTab}
                >
                    {filteredEvents.length === 0 ? (
                        <div className={s.placeholder}>
                            {activeTab === 'upcoming' && 'No upcoming events scheduled yet.'}
                            {activeTab === 'current' && 'No events currently happening.'}
                            {activeTab === 'past' && 'Archive of past events will appear here.'}
                        </div>
                    ) : (
                        <div className={activeTab === 'past' ? s.grid : s.eventsListColumn}>
                            {filteredEvents.map(event => {
                                const isRegistered = registrations.includes(event.id)
                                const now = new Date()
                                const opensAt = event.registration_open_time ? new Date(event.registration_open_time) : null
                                // Check if registration is open either by time or by countdown completion
                                const hasOpened = openedRegistrations[event.id] === true
                                const isRegistrationOpen = !opensAt || now >= opensAt || hasOpened

                                // Calculate dynamic registration status based on timing
                                let displayStatus = event.registration_status;

                                // If event is in the past, registration should be closed
                                if (event.category === 'past') {
                                    displayStatus = 'closed';
                                }
                                // If registration hasn't opened yet (and countdown hasn't completed), show on-hold
                                else if (opensAt && now < opensAt && !hasOpened && event.registration_status !== 'closed') {
                                    displayStatus = 'on-hold';
                                }
                                // If registration has opened (via countdown or time), show as open (unless DB says closed)
                                else if ((event.category === 'upcoming' || event.category === 'current') && event.registration_status !== 'closed') {
                                    displayStatus = isRegistrationOpen ? 'open' : event.registration_status;
                                }
                                // If event is upcoming or current, respect the database status
                                else if (event.category === 'upcoming' || event.category === 'current') {
                                    displayStatus = event.registration_status;
                                }

                                // Check if event is full
                                const currentRegistrations = event.currentRegistrations || 0
                                const maxRegistrations = event.max_registrations || null
                                const isFull = maxRegistrations && currentRegistrations >= maxRegistrations
                                const spotsLeft = maxRegistrations ? maxRegistrations - currentRegistrations : null

                                const hasDescription = !!event.description;

                                // Handler for keyboard accessibility
                                const handleCardKeyDown = (e) => {
                                    if (hasDescription && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        setSelectedEvent(event);
                                    }
                                };

                                // PAST EVENTS LAYOUT (VERTICAL SIMPLE)
                                if (activeTab === 'past') {
                                    return (
                                        <div
                                            key={event.id}
                                            className={cn(s.card, s.cardVertical, hasDescription && s.cardClickable)}
                                            onClick={() => hasDescription && setSelectedEvent(event)}
                                            onKeyDown={handleCardKeyDown}
                                            tabIndex={hasDescription ? 0 : undefined}
                                            role={hasDescription ? 'button' : undefined}
                                            aria-label={hasDescription ? `View details for ${event.title}` : undefined}
                                        >
                                            <div className={cn(s['card-image'], s.cardImagePastEvent)}>
                                                {event.image_url ? (
                                                    <Image
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        fill
                                                        sizes="(max-width: 800px) 50vw, 300px"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div className={s['no-image']}>CIS Event</div>
                                                )}
                                            </div>
                                            <div className={s['card-content']}>
                                                <h3 className={s['card-title']}>{event.title}</h3>
                                                <span className={s.date}>
                                                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }

                                // UPCOMING / CURRENT EVENTS LAYOUT (HORIZONTAL: POSTER LEFT, CONTENT RIGHT)
                                return (
                                    <div
                                        key={event.id}
                                        className={cn(s.card, s.cardHorizontal, hasDescription && s.cardClickable)}
                                        onClick={() => hasDescription && setSelectedEvent(event)}
                                        onKeyDown={handleCardKeyDown}
                                        tabIndex={hasDescription ? 0 : undefined}
                                        role={hasDescription ? 'button' : undefined}
                                        aria-label={hasDescription ? `View details for ${event.title}` : undefined}
                                    >
                                        {/* LEFT: VERTICAL POSTER */}
                                        <div className={cn(s['card-image'], s.cardImagePoster)}>
                                            {event.image_url ? (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    fill
                                                    sizes="(max-width: 800px) 100vw, 300px"
                                                    style={{ objectFit: 'contain' }}
                                                    priority={filteredEvents.indexOf(event) < 2}
                                                />
                                            ) : (
                                                <div className={s['no-image']}>CIS Event</div>
                                            )}
                                        </div>

                                        {/* RIGHT: DETAILS */}
                                        <div className={cn(s['card-content'], s.cardContentHorizontal)}>
                                            <div>
                                                <h3 className={cn(s['card-title'], s.cardTitleLarge)}>{event.title}</h3>
                                            </div>

                                            <div className={s.eventDetails}>
                                                <span className={s.detailLabel}>Date :</span>
                                                <span>{event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}</span>

                                                {(event.start_time || event.end_time) && (
                                                    <>
                                                        <span className={s.detailLabel}>Time :</span>
                                                        <span>
                                                            {event.start_time && event.end_time
                                                                ? `${event.start_time} - ${event.end_time}`
                                                                : event.start_time || event.end_time
                                                            }
                                                        </span>
                                                    </>
                                                )}

                                                {event.venue && (
                                                    <>
                                                        <span className={s.detailLabel}>Venue :</span>
                                                        <span>{event.venue}</span>
                                                    </>
                                                )}

                                                <span className={s.detailLabel}>Registration :</span>
                                                <span className={cn(
                                                    displayStatus === 'open' && !isFull && s.statusOpen,
                                                    displayStatus === 'on-hold' && s.statusOnHold,
                                                    (displayStatus === 'closed' || isFull) && s.statusClosed
                                                )}>
                                                    {isFull ? 'Full' : displayStatus}
                                                    {maxRegistrations && !isFull && displayStatus === 'open' && (
                                                        <span className={s.spotsLeft}> (Max: {maxRegistrations})</span>
                                                    )}
                                                    <span className="sr-only">
                                                        {isFull && ' - Event is full, no more registrations available'}
                                                        {displayStatus === 'open' && !isFull && ' - Registration is currently open'}
                                                        {displayStatus === 'on-hold' && ' - Registration opens soon'}
                                                        {displayStatus === 'closed' && !isFull && ' - Registration is closed'}
                                                    </span>
                                                </span>
                                            </div>

                                            {/* COUNTDOWN / REGISTRATION */}
                                            {!isRegistrationOpen && opensAt ? (
                                                <div className={s.countdownBox}>
                                                    Opens in: <Countdown
                                                        targetDate={opensAt}
                                                        onComplete={() => {
                                                            // Mark this event's registration as opened
                                                            setOpenedRegistrations(prev => ({
                                                                ...prev,
                                                                [event.id]: true
                                                            }))
                                                            // Force re-render to update the UI
                                                            forceUpdate(n => n + 1)
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                activeTab !== 'past' && event.registration_status !== 'closed' && !isFull && (
                                                    <div className={s.actionsWrapper}>
                                                        <div className={s.actions}>
                                                            {event.registration_link ? (
                                                                <a
                                                                    href={event.registration_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={cn(s.btn, s.btnLarge)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Register Now ↗
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    className={cn(s.btn, s.btnLarge, isRegistered && s.registered)}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (!isRegistered) {
                                                                            if (!user) {
                                                                                setShowLoginModal(true)
                                                                            } else {
                                                                                onRegister(event)
                                                                            }
                                                                        }
                                                                    }}
                                                                    disabled={isRegistered}
                                                                >
                                                                    {isRegistered ? 'Registered ✓' : 'Register'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            {showLogoutModal && (
                <div
                    className={s.logoutModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="logout-modal-title"
                >
                    <div className={s.logoutModalContent}>
                        <h3 id="logout-modal-title">Logout?</h3>
                        <p>Are you sure you want to exit?</p>

                        <div className={s.modalButtonGroup}>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className={s.modalBtnCancel}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className={s.modalBtnConfirm}
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div
                    className={s.loginModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="login-modal-title"
                >
                    <div className={s.loginModalContent}>
                        <h3 id="login-modal-title">Login Required</h3>
                        <p>You must be logged in to register for events.</p>

                        <div className={s.modalButtonGroup}>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className={s.modalBtnCancel}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowLoginModal(false)
                                    onLogin()
                                }}
                                className={s.modalBtnConfirm}
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Description Modal */}
            {selectedEvent && (
                <div
                    className={s.modalOverlay}
                    onClick={() => setSelectedEvent(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="event-modal-title"
                >
                    <div
                        className={s.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        data-lenis-prevent
                    >
                        <button
                            className={s.closeBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(null);
                            }}
                            aria-label="Close modal"
                        >
                            <span aria-hidden="true">✕</span>
                        </button>

                        <h3 id="event-modal-title" className={s.modalTitle}>{selectedEvent.title}</h3>

                        <div className={s.modalDescription}>
                            {selectedEvent.description}
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div className={s.notification} role="status" aria-live="polite">
                    <Logout aria-hidden="true" /> {notification}
                </div>
            )}
        </div >
    )
}

const Countdown = ({ targetDate, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const diff = targetDate - now

            if (diff <= 0) {
                setTimeLeft('Now')
                // Trigger callback when countdown completes
                if (onComplete) {
                    onComplete()
                }
                return true // Indicates countdown is complete
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
            return false // Countdown still running
        }

        // Initial calculation
        const isComplete = calculateTimeLeft()

        // Only set interval if countdown is not already complete
        if (!isComplete) {
            const interval = setInterval(() => {
                const complete = calculateTimeLeft()
                if (complete) {
                    clearInterval(interval)
                }
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [targetDate, onComplete])

    return <span>{timeLeft}</span>
}
