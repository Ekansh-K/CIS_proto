import { Layout } from 'layouts/default'
import { useStore } from 'lib/store'
import { useEffect, useState } from 'react'
import s from './events.module.scss'
import cn from 'clsx'

export default function Events() {
    const { setTransition } = useStore()
    const [activeTab, setActiveTab] = useState('upcoming')

    useEffect(() => {
        // Trigger collapse on mount to reveal page
        setTransition({ state: 'collapsing' })
    }, [setTransition])

    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'current', label: 'Current' },
        { id: 'past', label: 'Past' },
    ]

    return (
        <Layout
            theme="light"
            seo={{
                title: 'CIS - Events',
                description: 'Upcoming and past events',
            }}
            className={s.events}
            hideFooter
        >
            <div className={s.inner}>
                <h1 className={s.title}>Events</h1>

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
        </Layout>
    )
}
