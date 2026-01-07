import { useState, useEffect } from 'react'
import { supabaseAdmin } from 'lib/supabase'
import { useRouter } from 'next/router'

import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import * as XLSX from 'xlsx'
import s from './admin.module.scss'


export default function AdminDashboard() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRegModalOpen, setIsRegModalOpen] = useState(false)
    const [currentRegistrations, setCurrentRegistrations] = useState([])


    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'upcoming',
        date: new Date(),
        image_url: '',
        registration_link: '',
        registration_status: 'open',
        venue: '',
        event_time: '',
        registration_open_time: null
    })
    const [imageFile, setImageFile] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(null)

    useEffect(() => {
        checkUser()
        fetchEvents()
    }, [])

    async function checkUser() {
        const { data: { session } } = await supabaseAdmin.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        } else {
            setUser(session.user)
        }
    }

    async function fetchEvents() {
        const { data } = await supabaseAdmin
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setEvents(data)
        setLoading(false)
    }

    async function handleLogout() {
        await supabaseAdmin.auth.signOut()
        router.push('/admin/login')
    }

    // --- Event CRUD ---

    const openModal = (event = null) => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description || '',
                category: event.category,
                date: event.date ? new Date(event.date) : new Date(),
                image_url: event.image_url || '',
                registration_link: event.registration_link || '',
                registration_status: event.registration_status || 'open',
                venue: event.venue || '',
                event_time: event.event_time || '',
                registration_open_time: event.registration_open_time ? new Date(event.registration_open_time) : null
            })
            setIsEditing(true)
            setEditId(event.id)
        } else {
            setFormData({
                title: '',
                description: '',
                category: 'upcoming',
                date: new Date(),
                image_url: '',
                registration_link: '',
                image_url: '',
                registration_link: '',
                registration_status: 'open',
                venue: '',
                event_time: '',
                registration_open_time: null
            })
            setIsEditing(false)
            setEditId(null)
        }
        setImageFile(null)
        setIsModalOpen(true)
    }

    const deleteEvent = async (id) => {
        if (!confirm('Are you sure you want to delete this event? This will also delete all registrations associated with it.')) return

        // 1. Delete associated registrations first
        const { error: regError } = await supabaseAdmin
            .from('registrations')
            .delete()
            .eq('event_id', id)

        if (regError) {
            alert('Error deleting associated registrations: ' + regError.message)
            return
        }

        // 2. Delete the event
        const { error } = await supabaseAdmin.from('events').delete().eq('id', id)

        if (!error) {
            fetchEvents()
        } else {
            alert('Error deleting event: ' + error.message)
        }
    }

    const uploadImage = async () => {
        if (!imageFile) return formData.image_url

        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from('event_posters')
            .upload(filePath, imageFile)

        if (uploadError) {
            alert('Error uploading image: ' + uploadError.message)
            return null
        }

        const { data } = supabaseAdmin.storage.from('event_posters').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const finalImageUrl = await uploadImage()
        if (finalImageUrl === null && imageFile) {
            setLoading(false)
            return
        }

        const payload = {
            ...formData,
            image_url: finalImageUrl || formData.image_url // keep old if no new upload
        }

        let error
        if (isEditing) {
            const { error: updateError } = await supabaseAdmin
                .from('events')
                .update(payload)
                .eq('id', editId)
            error = updateError
        } else {
            const { error: insertError } = await supabaseAdmin
                .from('events')
                .insert([payload])
            error = insertError
        }

        if (error) {
            alert('Error saving event: ' + error.message)
        } else {
            setIsModalOpen(false)
            fetchEvents()
        }
        setLoading(false)
    }

    // --- Registrations ---

    const viewRegistrations = async (eventId) => {
        setLoading(true)

        const { data } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .eq('event_id', eventId)

        if (data) setCurrentRegistrations(data)
        setIsRegModalOpen(true)
        setLoading(false)
    }

    if (!user) return null // or loading spinner

    return (
        <div className={s.dashboard}>
            <header className={s.header}>
                <h1 className="h4">Admin Dashboard</h1>
                <div className={s.actions}>
                    <span>{user.email}</span>
                    <button className={s.adminLogoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className={s.controls} style={{ marginBottom: '2rem' }}>
                <button className={s.adminBtn} onClick={() => openModal()}>+ Add New Event</button>
            </div>

            <div className={s.grid}>
                {events.map(event => (
                    <div key={event.id} className={s.card}>
                        {event.image_url && (
                            <img src={event.image_url} alt={event.title} className={s.image} />
                        )}
                        <div className={s.content}>
                            <h3>{event.title}</h3>
                            <p className={s.meta}>{new Date(event.date).toLocaleDateString()}</p>
                            <p className={s.meta} style={{ textTransform: 'capitalize' }}>
                                {event.category} • {event.registration_status}
                            </p>
                        </div>
                        <div className={s.actions}>
                            <button onClick={() => viewRegistrations(event.id)}>Registrations</button>
                            <button onClick={() => openModal(event)}>Edit</button>
                            <button className={s.delete} onClick={() => deleteEvent(event.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Event Modal */}
            {isModalOpen && (
                <div className={s.overlay}>
                    <div className={s.modal}>
                        <h2>{isEditing ? 'Edit Event' : 'New Event'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={s.inputGroup}>
                                <label>Title</label>
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={s.row}>
                                <div className={s.inputGroup}>
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="current">Current</option>
                                        <option value="past">Past</option>
                                    </select>
                                </div>
                                <div className={s.inputGroup}>
                                    <label>Date</label>
                                    <DatePicker
                                        selected={formData.date}
                                        onChange={date => setFormData({ ...formData, date })}
                                        className={s.datePicker}
                                        wrapperClassName={s.datePickerWrapper}
                                    />
                                </div>
                            </div>

                            <div className={s.row}>
                                <div className={s.inputGroup}>
                                    <label>Event Time</label>
                                    <input
                                        value={formData.event_time}
                                        onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                                        placeholder="e.g. 10:00 AM"
                                    />
                                </div>
                                <div className={s.inputGroup}>
                                    <label>Venue</label>
                                    <input
                                        value={formData.venue}
                                        onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                        placeholder="e.g. Main Auditorium"
                                    />
                                </div>
                            </div>

                            <div className={s.inputGroup}>
                                <label>Registration Opens At (Optional)</label>
                                <DatePicker
                                    selected={formData.registration_open_time}
                                    onChange={date => setFormData({ ...formData, registration_open_time: date })}
                                    showTimeSelect
                                    dateFormat="Pp"
                                    placeholderText="Click to select date and time"
                                    className={s.datePicker}
                                    wrapperClassName={s.datePickerWrapper}
                                />
                            </div>

                            <div className={s.inputGroup}>
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    style={{ padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                                />
                            </div>

                            <div className={s.inputGroup}>
                                <label>Poster Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setImageFile(e.target.files[0])}
                                />
                                {formData.image_url && !imageFile && (
                                    <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Current: {formData.image_url.split('/').pop()}</p>
                                )}
                            </div>

                            <div className={s.row}>
                                <div className={s.inputGroup}>
                                    <label>Registration Status</label>
                                    <select
                                        value={formData.registration_status}
                                        onChange={e => setFormData({ ...formData, registration_status: e.target.value })}
                                        style={{ padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                                    >
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className={s.inputGroup}>
                                    <label>External Link (Optional)</label>
                                    <input
                                        value={formData.registration_link}
                                        onChange={e => setFormData({ ...formData, registration_link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className={s.buttons}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={s.adminBtn} style={{ background: 'transparent', borderColor: '#444' }}>Cancel</button>
                                <button type="submit" disabled={loading} className={s.adminBtn} style={{ background: 'white', color: 'black' }}>{loading ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Registrations Modal */}
            {isRegModalOpen && (
                <div className={s.overlay}>
                    <div className={s.modal} style={{ maxWidth: '900px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2>Registrations ({currentRegistrations.length})</h2>
                            <button
                                onClick={() => {
                                    if (currentRegistrations.length === 0) return
                                    const ws = XLSX.utils.json_to_sheet(currentRegistrations.map(r => ({
                                        Email: r.user_email,
                                        FullName: r.full_name || '-',
                                        Date: new Date(r.created_at).toLocaleDateString(),
                                        Time: new Date(r.created_at).toLocaleTimeString()
                                    })))
                                    const wb = XLSX.utils.book_new()
                                    XLSX.utils.book_append_sheet(wb, ws, "Registrations")
                                    XLSX.writeFile(wb, `registrations.xlsx`)
                                }}
                                className={s.adminBtn}
                                style={{ background: '#27ae60', borderColor: '#27ae60', fontSize: '0.9rem' }}
                            >
                                Download Excel
                            </button>
                        </div>

                        <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #444', borderRadius: '4px' }}>
                            {currentRegistrations.length === 0 ? (
                                <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No registrations yet.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead style={{ background: '#222', position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Email</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Full Name</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Registered At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRegistrations.map((reg, i) => (
                                            <tr key={reg.id} style={{ borderBottom: '1px solid #333', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                                <td style={{ padding: '0.8rem 1rem' }}>{reg.user_email}</td>
                                                <td style={{ padding: '0.8rem 1rem' }}>{reg.full_name || '-'}</td>
                                                <td style={{ padding: '0.8rem 1rem' }}>{new Date(reg.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className={s.buttons} style={{ marginTop: '1.5rem' }}>
                            <button onClick={() => setIsRegModalOpen(false)} className={s.adminBtn}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
