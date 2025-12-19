import { useState } from 'react'
import s from '../../pages/events/events.module.scss'
// Actually let's keep scss in pages/events/events.module.scss for now and import it here.
import cn from 'clsx'
import dynamic from 'next/dynamic'

const Sun = dynamic(() => import('icons/sun.svg'), { ssr: false })
const Moon = dynamic(() => import('icons/moon.svg'), { ssr: false })
const Arrow = dynamic(() => import('icons/arrow-buttons.svg'), { ssr: false })

export const EventsContent = ({ theme, transition, toggleTheme, goBack }) => {
    const [activeTab, setActiveTab] = useState('upcoming')

    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'current', label: 'Current' },
        { id: 'past', label: 'Past' },
    ]

    return (
        <div className={cn(s.events, theme === 'dark' && s.dark)} style={{ minHeight: '100vh', paddingTop: '200px' }}>
            <div className={s.inner}>
                <div className={s['header-row']}>
                    <div className={s['title-col']}>
                        <button className={s['back-btn']} onClick={goBack} aria-label="Go Back">
                            <Arrow />
                        </button>
                        <h1 className={s.title}>Events</h1>
                    </div>
                    {/* Only show toggle if we are the interactable layer? Or both? */}
                    {/* Both need to render to look identical. But pointer events handle interaction. */}
                    <button className={s['theme-toggle']} onClick={toggleTheme} aria-label="Toggle Dark Mode">
                        {theme === 'light' ? <Moon /> : <Sun />}
                    </button>
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
                    <div className={s.placeholder}>
                        {activeTab === 'upcoming' && 'No upcoming events scheduled yet.'}
                        {activeTab === 'current' && 'No events currently happening.'}
                        {activeTab === 'past' && 'Archive of past events will appear here.'}
                    </div>
                </div>
            </div>
        </div>
    )
}
