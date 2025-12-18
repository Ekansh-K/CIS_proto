import { useStore } from 'lib/store'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import s from './transition-overlay.module.scss'

export const TransitionOverlay = () => {
    const { transition, setTransition } = useStore()
    const circleRef = useRef(null)

    useEffect(() => {
        if (transition.state === 'expanding') {
            const { x, y } = transition.origin

            // Calculate radius to cover the screen
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            // Distance to furthest corner
            const distX = Math.max(x, viewportWidth - x)
            const distY = Math.max(y, viewportHeight - y)
            const radius = Math.sqrt(distX * distX + distY * distY)
            const diameter = radius * 2

            // Initial set
            gsap.set(circleRef.current, {
                x: x,
                y: y,
                scale: 0,
                opacity: 1
            })

            // Expand
            gsap.to(circleRef.current, {
                scale: diameter / 100, // Normalized scale since base size is 100px
                duration: 0.8,
                ease: 'power3.inOut', // Smooth ease
                onComplete: () => {
                    setTransition({ state: 'expanded' })
                },
            })
        } else if (transition.state === 'collapsing') {
            // Collapse logic - maybe fade out or scale down
            // For "opposite manner", we could scale down to center or 0

            gsap.to(circleRef.current, {
                scale: 0,
                opacity: 0, // Fade out slightly for smoother feel
                duration: 0.8,
                ease: 'power3.inOut',
                onComplete: () => {
                    setTransition({ state: 'idle', isActive: false })
                },
            })
        }
    }, [transition.state, transition.origin, setTransition])

    if (!transition.isActive && transition.state === 'idle') return null

    return (
        <div className={s.overlay}>
            <div className={s.circle} ref={circleRef} />
        </div>
    )
}
