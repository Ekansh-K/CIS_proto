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
    const router = useRouter()

    // Config for the reveal animation
    const [isAnimating, setIsAnimating] = useState(false)
    const revealRef = useRef(null) // Top layer

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

        // The "next" theme is already rendered in the reveal layer (see render).
        // We just need to animate the clip-path.

        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const distX = Math.max(x, viewportWidth - x)
        const distY = Math.max(y, viewportHeight - y)
        const radius = Math.sqrt(distX * distX + distY * distY)

        // Start circle at 0
        gsap.set(revealRef.current, {
            clipPath: `circle(0px at ${x}px ${y}px)`,
            zIndex: 10,
            visibility: 'visible'
        })

        gsap.to(revealRef.current, {
            clipPath: `circle(${radius}px at ${x}px ${y}px)`,
            duration: 1,
            ease: 'power3.inOut',
            onComplete: () => {
                // Animation Done.
                // 1. Swap the real theme state to match the top layer.
                setTheme(prev => prev === 'light' ? 'dark' : 'light')

                // 2. Reset the top layer to be hidden (but since theme swapped, Bottom layer is now New Theme).
                // So top layer becomes "Next Next Theme" (Old Theme).
                // Careful: 
                // Theme = Dark. Top = Light. 
                // Animate Top (Light) to full.
                // Set Theme = Light. 
                // Bottom is now Light. Top is now Dark (next inversion).
                // If we assume Top is always "Opposite of Theme".
                // We just need to hide Top instantly? 

                gsap.set(revealRef.current, { visibility: 'hidden', clipPath: 'none' }) // or circle(0)
                setIsAnimating(false)
            }
        })
    }

    const nextTheme = theme === 'light' ? 'dark' : 'light'

    return (
        <Layout
            theme={theme} // Passing current theme to layout (sets navigation colors etc if needed)
            seo={{
                title: 'CIS - Events',
                description: 'Upcoming and past events',
            }}
            hideFooter
            className={s.eventsPageWrapper} // New wrapper class
        >
            <div className={s.layersContainer}>
                {/* Bottom Layer: Current Theme */}
                <div className={s.layer} style={{ zIndex: 1 }}>
                    <EventsContent
                        theme={theme}
                        goBack={goBack}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Top Layer: Next Theme (Masked) */}
                <div
                    className={s.layer}
                    ref={revealRef}
                    style={{
                        zIndex: 2,
                        visibility: 'hidden',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <EventsContent
                        theme={nextTheme}
                        goBack={goBack}
                        toggleTheme={toggleTheme}
                    />
                </div>
            </div>
        </Layout>
    )
}
