import { useStore } from 'lib/store'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import s from './transition-overlay.module.scss'
import cn from 'clsx'

export const TransitionOverlay = () => {
    const { transition, setTransition } = useStore()
    const circleRef = useRef(null)

    useEffect(() => {
        if (!transition.isActive) {
            if (circleRef.current) {
                gsap.set(circleRef.current, { scale: 0, opacity: 0 })
            }
            return
        }

        if (transition.state === 'expanding') {
            const { x, y } = transition.origin

            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            const distX = Math.max(x, viewportWidth - x)
            const distY = Math.max(y, viewportHeight - y)
            const radius = Math.sqrt(distX * distX + distY * distY)
            const diameter = radius * 2

            gsap.set(circleRef.current, {
                x: x,
                y: y,
                scale: 0,
                opacity: 1,
                backgroundColor: transition.color || 'white'
            })

            gsap.to(circleRef.current, {
                scale: diameter / 100,
                duration: typeof transition.duration === 'number' ? transition.duration : 0.8,
                ease: 'power3.inOut',
                onComplete: () => {
                    setTransition({ state: 'expanded' })
                },
            })
        } else if (transition.state === 'collapsing') {

            gsap.to(circleRef.current, {
                scale: 0,
                opacity: 0,
                duration: typeof transition.duration === 'number' ? transition.duration : 0.8,
                ease: 'power3.inOut',
                onComplete: () => {
                    setTransition({ state: 'idle', isActive: false })
                },
            })
        }

        // Cleanup function to ensure we don't leave artifacts if unmounted rapidly
        return () => {
            if (circleRef.current) {
                gsap.killTweensOf(circleRef.current)
            }
        }
    }, [transition.isActive, transition.state, transition.origin, setTransition])

    if (!transition.isActive && transition.state === 'idle') return null

    return (
        <div className={cn(s.overlay, transition.mode === 'inversion' && s.inversion)}>
            <div className={s.circle} ref={circleRef} />
        </div>
    )
}
