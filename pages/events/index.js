import { Layout } from 'layouts/default'
import { useStore } from 'lib/store'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import s from './events.module.scss'
import { useRouter } from 'next/router'
import { EventsContent } from 'components/events-content'
import { gsap } from 'gsap'
import { supabase } from 'lib/supabase'

// Sanitize user input to prevent injection attacks (module scope to avoid recreation)
const sanitize = (str) => {
    if (!str) return str
    return String(str).replace(/[<>'"]/g, '').trim().slice(0, 255)
}

export default function Events() {
    const { setTransition } = useStore()
    const [theme, setTheme] = useState('dark') // Default Dark
    const [activeTab, setActiveTab] = useState('upcoming') // Lifted State
    const router = useRouter()

    // Data State
    const [events, setEvents] = useState([])
    const [user, setUser] = useState(null)
    const [registrations, setRegistrations] = useState([])
    const [eventRegistrationCounts, setEventRegistrationCounts] = useState({}) // Track registration counts per event

    // Refs for layers
    const darkLayerRef = useRef(null)
    const lightLayerRef = useRef(null)
    const [isAnimating, setIsAnimating] = useState(false)

    // Ref to hold current event IDs for the real-time subscription callback
    const eventIdsRef = useRef([])

    // Fetch the actual count for a single event from the database
    const fetchSingleEventCount = useCallback(async (eventId) => {
        const { count, error } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)

        if (!error && count !== null) {
            setEventRegistrationCounts(prev => ({
                ...prev,
                [eventId]: count
            }))
        }
    }, [])

    // Fetch registration counts for all events using efficient head-count queries
    const fetchAllRegistrationCounts = useCallback(async (eventIds) => {
        if (!eventIds || !eventIds.length) return

        // Use parallel head-count queries — only returns the count, not the rows
        const counts = {}
        eventIds.forEach(id => { counts[id] = 0 })

        await Promise.all(eventIds.map(async (id) => {
            const { count, error } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', id)

            if (!error && count !== null) {
                counts[id] = count
            }
        }))

        setEventRegistrationCounts(counts)
    }, [])

    useEffect(() => {
        // Check if returning from Login (Hash present)
        const isReturningFromAuth = window.location.hash.includes('access_token')

        // Initial page load reveal (Global white overlay)
        // If returning from auth, skip the animation (duration: 0)
        setTransition({ state: 'collapsing', duration: isReturningFromAuth ? 0 : 0.8 })

        // Fetch Data
        fetchEvents()

        // Listen for Auth Changes (Login, Logout, Initial Session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

            if (session) {
                setUser(session.user)
                fetchRegistrations(session.user.id)
            } else {
                setUser(null)
                setRegistrations([])
            }
        })

        return () => subscription.unsubscribe()
    }, [setTransition])

    // Real-time subscription for registration changes
    // This ensures the count updates when ANYONE registers or is removed
    useEffect(() => {
        const channel = supabase
            .channel('registrations-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'registrations' },
                (payload) => {

                    // When any registration is inserted or deleted, re-fetch the count
                    // for the affected event
                    const eventId = payload.new?.event_id || payload.old?.event_id
                    if (eventId) {
                        fetchSingleEventCount(eventId)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchSingleEventCount])

    // Helper function to calculate event category based on date and time
    function getEventCategory(event) {
        const now = new Date()

        if (!event.date) return 'upcoming' // No date set, default to upcoming

        const eventDate = new Date(event.date)

        // Parse start and end times
        const startTime = event.start_time ? parseTime(event.start_time) : null
        const endTime = event.end_time ? parseTime(event.end_time) : null

        // Create full datetime for event start
        let eventStart = new Date(eventDate)
        if (startTime) {
            eventStart.setHours(startTime.hours, startTime.minutes, 0, 0)
        } else {
            eventStart.setHours(0, 0, 0, 0) // Start of day if no time specified
        }

        // Create full datetime for event end
        let eventEnd = new Date(eventDate)
        if (endTime) {
            eventEnd.setHours(endTime.hours, endTime.minutes, 0, 0)
        } else if (startTime) {
            // If only start time, assume event lasts 2 hours
            eventEnd.setHours(startTime.hours + 2, startTime.minutes, 0, 0)
        } else {
            eventEnd.setHours(23, 59, 59, 999) // End of day if no time specified
        }

        // Determine category
        if (now < eventStart) {
            return 'upcoming'
        } else if (now >= eventStart && now <= eventEnd) {
            return 'current'
        } else {
            return 'past'
        }
    }

    // Helper to parse time string like "09:00 AM" or "14:30"
    function parseTime(timeStr) {
        if (!timeStr) return null

        // Try parsing "HH:MM AM/PM" format
        const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
        if (ampmMatch) {
            let hours = parseInt(ampmMatch[1])
            const minutes = parseInt(ampmMatch[2])
            const period = ampmMatch[3].toUpperCase()

            if (period === 'PM' && hours !== 12) hours += 12
            if (period === 'AM' && hours === 12) hours = 0

            return { hours, minutes }
        }

        // Try parsing "HH:MM" 24-hour format
        const match24 = timeStr.match(/(\d{1,2}):(\d{2})/)
        if (match24) {
            return { hours: parseInt(match24[1]), minutes: parseInt(match24[2]) }
        }

        return null
    }

    // Compute events with dynamic categories (memoized to avoid unnecessary re-renders)
    const eventsWithCategories = useMemo(() =>
        events.map(event => ({
            ...event,
            category: getEventCategory(event),
            currentRegistrations: eventRegistrationCounts[event.id] ?? 0
        })),
        [events, eventRegistrationCounts]
    )

    async function fetchEvents() {
        const { data } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true })
        if (data) {
            setEvents(data)
            const ids = data.map(e => e.id)
            eventIdsRef.current = ids
            // Fetch registration counts for all events
            fetchAllRegistrationCounts(ids)
        }
    }

    async function fetchRegistrations(userId) {
        const { data } = await supabase
            .from('registrations')
            .select('event_id')
            .eq('user_id', userId)

        if (data) {
            setRegistrations(data.map(r => r.event_id))
        }
    }

    const handleLogin = async () => {
        const redirectUrl = window.location.origin + '/events'


        await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: redirectUrl,
                scopes: 'openid profile email user.read',
                queryParams: {
                    prompt: 'select_account'
                }
            }
        })
    }

    const handleRegister = async (event) => {
        if (!user) {
            // Login with Azure — redirect back to /events after auth
            await supabase.auth.signInWithOAuth({
                provider: 'azure',
                options: {
                    redirectTo: window.location.origin + '/events',
                    scopes: 'openid profile email user.read',
                    queryParams: { prompt: 'select_account' }
                }
            })
            return
        }

        if (!user.email.endsWith('@bl.students.amrita.edu') && user.email !== 'ieeecisaseb@gmail.com') {
            alert('Registration Restricted: You must use your @bl.students.amrita.edu email address.')
            await supabase.auth.signOut()
            setUser(null)
            return
        }

        if (registrations.includes(event.id)) {
            alert('You are already registered!')
            return
        }

        // Re-fetch the latest count from DB before checking the limit
        // This prevents race conditions where the local count is stale
        let latestCount = eventRegistrationCounts[event.id] || 0
        if (event.max_registrations) {
            const { count, error: countError } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id)

            if (!countError && count !== null) {
                latestCount = count
                // Also update local state with the fresh count
                setEventRegistrationCounts(prev => ({
                    ...prev,
                    [event.id]: count
                }))
            }

            if (latestCount >= event.max_registrations) {
                alert('Sorry, this event has reached its maximum registration limit.')
                return
            }
        }

        // Register
        const { error } = await supabase
            .from('registrations')
            .insert([{
                event_id: event.id,
                user_id: user.id,
                user_email: sanitize(user.email),
                full_name: sanitize(user.user_metadata?.full_name || user.email)
            }])

        if (error) {
            // Handle unique constraint violation (duplicate registration)
            if (error.code === '23505') {
                alert('You are already registered for this event!')
                // Sync local state
                if (!registrations.includes(event.id)) {
                    setRegistrations([...registrations, event.id])
                }
            } else {
                alert('Registration failed: ' + error.message)
            }
        } else {
            alert('Successfully registered!')
            setRegistrations([...registrations, event.id])
            // Re-fetch the actual count from DB to ensure accuracy
            // (the real-time subscription may also fire, but this ensures immediate update)
            await fetchSingleEventCount(event.id)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setRegistrations([])
        alert('Logged out successfully.')
    }

    const goBack = () => {
        setTransition({
            isActive: true,
            state: 'expanding',
            mode: 'cover',
            color: 'white',
            origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        })
        setTimeout(() => {
            router.push('/')
        }, 800)
    }

    const toggleTheme = (e) => {
        if (isAnimating) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2

        setIsAnimating(true)

        const nextTheme = theme === 'light' ? 'dark' : 'light'
        const targetLayer = nextTheme === 'light' ? lightLayerRef.current : darkLayerRef.current

        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const distX = Math.max(x, viewportWidth - x)
        const distY = Math.max(y, viewportHeight - y)
        const radius = Math.sqrt(distX * distX + distY * distY)

        gsap.set(targetLayer, {
            clipPath: `circle(0px at ${x}px ${y}px)`,
            zIndex: 10, // Ensure it's on top during animation
            visibility: 'visible'
        })

        gsap.to(targetLayer, {
            clipPath: `circle(${radius}px at ${x}px ${y}px)`,
            duration: 1.2,
            ease: 'expo.inOut',
            onComplete: () => {
                setTheme(nextTheme)
                setIsAnimating(false)

                const oldLayer = nextTheme === 'light' ? darkLayerRef.current : lightLayerRef.current

                // Clear inline styles from animation on the winner, but KEEP visibility to prevent blink if React delays
                gsap.set(targetLayer, { clearProps: 'zIndex,clipPath' })

                // Hide the loser
                gsap.set(oldLayer, { clipPath: 'circle(0px at 50% 50%)', visibility: 'hidden', clearProps: 'zIndex' })
            }
        })
    }

    return (
        <Layout
            theme={theme}
            seo={{
                title: 'CIS - Events',
                description: 'Upcoming and past events',
            }}
            hideFooter
            hideScrollbar={true}
            className={s.eventsPageWrapper}
        >
            <div className={s.layersContainer}>
                {/* Dark Layer */}
                <div
                    className={s.layer}
                    ref={darkLayerRef}
                    style={{
                        position: theme === 'dark' ? 'relative' : 'absolute',
                        zIndex: theme === 'dark' ? 1 : 2,
                        pointerEvents: theme === 'dark' ? 'auto' : 'none',
                        visibility: theme === 'dark' ? 'visible' : 'hidden'
                    }}
                >
                    <EventsContent
                        theme="dark"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        goBack={goBack}
                        toggleTheme={toggleTheme}
                        events={eventsWithCategories}
                        user={user}
                        registrations={registrations}
                        onRegister={handleRegister}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Light Layer */}
                <div
                    className={s.layer}
                    ref={lightLayerRef}
                    style={{
                        position: theme === 'light' ? 'relative' : 'absolute',
                        zIndex: theme === 'light' ? 1 : 2,
                        pointerEvents: theme === 'light' ? 'auto' : 'none',
                        visibility: theme === 'light' ? 'visible' : 'hidden'
                    }}
                >
                    <EventsContent
                        theme="light"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        goBack={goBack}
                        toggleTheme={toggleTheme}
                        events={eventsWithCategories}
                        user={user}
                        registrations={registrations}
                        onRegister={handleRegister}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        </Layout>
    )
}
