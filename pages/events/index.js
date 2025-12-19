import { Layout } from 'layouts/default'
import { useStore } from 'lib/store'
import { useEffect, useState, useRef } from 'react'
import s from './events.module.scss'
import cn from 'clsx'
import { useRouter } from 'next/router'
import { EventsContent } from 'components/events-content'
import { gsap } from 'gsap'

export default function Events() {
    const { transition, setTransition } = useStore()
    const [theme, setTheme] = useState('dark') // Default Dark
    const [activeTab, setActiveTab] = useState('upcoming') // Lifted State
    const router = useRouter()

    // Refs for layers
    const darkLayerRef = useRef(null)
    const lightLayerRef = useRef(null)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        // Initial page load reveal (Global white overlay)
        setTransition({ state: 'collapsing' })
    }, [setTransition])

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

        // Ensure proper stacking order for animation
        // The one we rely on for "Next" is currently visually hidden (clipPath=0) and needs to be on TOP for the mask to work?
        // Actually, if we use Z-Index Swap:
        // Bottom Layer (Current) is Full.
        // Top Layer (Next) is 0.
        // We expand Top Layer.
        // When Top Layer is Full, it Covers Bottom.
        // Then we Swap state: "Top" becomes "Current" (Bottom). "Bottom" becomes "Next" (Top).
        // And we reset the new Top to 0.

        // So:
        // If Current is Dark: Dark is Z=1. Light is Z=2. Light is clip 0.
        // Animate Light to Full.
        // Set Theme = Light.
        // Now Light is Z=1. Dark is Z=2. Dark needs to be clip 0.

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

                // Reset the OLD layer (which is now the "Next" layer conceptually)
                // We rely on React state to update z-indices based on 'theme'.
                // Ideally, we wait for re-render?
                // But GSAP might hold styles.
                // Safest: Clear props on the "New Current" (targetLayer) so CSS takes over?
                // And Force 0 Clip on the "New Next".

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
            className={s.eventsPageWrapper}
        >
            <div className={s.layersContainer}>
                {/* Dark Layer */}
                <div
                    className={s.layer}
                    ref={darkLayerRef}
                    style={{
                        zIndex: theme === 'dark' ? 1 : 2, // If Dark active, it's bottom. If Light active, Dark is Top (waiting).
                        // Actually, simpler: Active is always bottom. Inactive is Top (masked).
                        // Wait, if Inactive is Top, it blocks clicks?
                        // pointer-events: none for Inactive.
                        pointerEvents: theme === 'dark' ? 'auto' : 'none',
                        visibility: theme === 'dark' ? 'visible' : 'hidden' // Initially hidden if inactive
                    }}
                >
                    <EventsContent
                        theme="dark"
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        goBack={goBack}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Light Layer */}
                <div
                    className={s.layer}
                    ref={lightLayerRef}
                    style={{
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
                    />
                </div>
            </div>
        </Layout>
    )
}
