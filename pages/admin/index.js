import { useState, useEffect, forwardRef } from 'react'
import { supabaseAdmin } from 'lib/supabase'
import { useRouter } from 'next/router'

import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import * as XLSX from 'xlsx'
import s from './admin.module.scss'

// Custom Date Input Component
const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <button className={s.datePickerTrigger} onClick={onClick} ref={ref} type="button">
        {value || "Select date"}
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>▼</span>
    </button>
))
CustomDateInput.displayName = "CustomDateInput"

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
        start_time: '',
        end_time: '',
        registration_open_time: null,
        max_registrations: ''
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
                start_time: event.start_time || '',
                end_time: event.end_time || '',
                registration_open_time: event.registration_open_time ? new Date(event.registration_open_time) : null,
                max_registrations: event.max_registrations || ''
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
                registration_status: 'open',
                venue: '',
                start_time: '',
                end_time: '',
                registration_open_time: null,
                max_registrations: ''
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

        // Validate file type (security: prevent malicious file uploads)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(imageFile.type)) {
            alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
            return null
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (imageFile.size > maxSize) {
            alert('File too large. Maximum size is 5MB.')
            return null
        }

        const fileExt = imageFile.name.split('.').pop().toLowerCase()
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        if (!allowedExtensions.includes(fileExt)) {
            alert('Invalid file extension.')
            return null
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
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

    // Sanitize text input to prevent XSS
    const sanitizeInput = (str) => {
        if (!str) return str
        return String(str).replace(/[<>]/g, '').trim()
    }

    // Validate URL format
    const isValidUrl = (url) => {
        if (!url) return true // optional field
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Validate registration link URL
        if (formData.registration_link && !isValidUrl(formData.registration_link)) {
            alert('Invalid registration link URL format.')
            setLoading(false)
            return
        }

        const finalImageUrl = await uploadImage()
        if (finalImageUrl === null && imageFile) {
            setLoading(false)
            return
        }

        // --- Auto Classification Logic ---
        const now = new Date();
        
        // Parse start_time and end_time to create full datetime objects
        let eventStart = new Date(formData.date);
        let eventEnd = new Date(formData.date);
        
        if (formData.start_time) {
            const [startHours, startMins] = formData.start_time.split(':');
            eventStart.setHours(parseInt(startHours), parseInt(startMins), 0, 0);
        } else {
            eventStart.setHours(0, 0, 0, 0);
        }
        
        if (formData.end_time) {
            const [endHours, endMins] = formData.end_time.split(':');
            eventEnd.setHours(parseInt(endHours), parseInt(endMins), 0, 0);
        } else {
            eventEnd.setHours(23, 59, 59, 999);
        }
        
        // Calculate Category based on start and end times
        let calculatedCategory = 'upcoming';
        if (now < eventStart) {
            calculatedCategory = 'upcoming';
        } else if (now >= eventStart && now <= eventEnd) {
            calculatedCategory = 'current';
        } else if (now > eventEnd) {
            calculatedCategory = 'past';
        }

        // Calculate Registration Status
        let calculatedRegStatus = 'open'; // Default
        if (calculatedCategory === 'past') {
            calculatedRegStatus = 'closed';
        } else if (formData.registration_open_time) {
            const regOpenTime = new Date(formData.registration_open_time);
            if (now < regOpenTime) {
                calculatedRegStatus = 'on-hold'; // Hasn't opened yet
            } else {
                calculatedRegStatus = 'open';
            }
        }
        
        // Sanitize all text inputs before saving
        const payload = {
            title: sanitizeInput(formData.title),
            description: sanitizeInput(formData.description),
            category: calculatedCategory,
            date: formData.date,
            image_url: finalImageUrl || formData.image_url,
            registration_link: formData.registration_link,
            registration_status: calculatedRegStatus,
            venue: sanitizeInput(formData.venue),
            start_time: sanitizeInput(formData.start_time),
            end_time: sanitizeInput(formData.end_time),
            registration_open_time: formData.registration_open_time,
            max_registrations: formData.max_registrations ? parseInt(formData.max_registrations) : null
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

                            {/* Event Date & Time */}
                            <div className={s.row} style={{ gap: '1rem' }}>
                                <div className={s.inputGroup} style={{ flex: 1 }}>
                                    <label>Date</label>
                                    <div className={s.datePickerWrapper}>
                                        <DatePicker
                                            selected={formData.date}
                                            onChange={date => setFormData({ ...formData, date })}
                                            customInput={<CustomDateInput />}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className={s.inputGroup} style={{ flex: 1 }}>
                                    <label>Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className={s.timeInput}
                                        style={{ colorScheme: 'dark' }} 
                                    />
                                </div>
                                <div className={s.inputGroup} style={{ flex: 1 }}>
                                    <label>End Time</label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className={s.timeInput}
                                        style={{ colorScheme: 'dark' }} 
                                    />
                                </div>
                            </div>

                            <div className={s.inputGroup}>
                                <label>Venue</label>
                                <input
                                    value={formData.venue}
                                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                    placeholder="e.g. Main Auditorium"
                                />
                            </div>

                            {/* Registration Opens At - Split Date/Time */}
                            <div className={s.inputGroup}>
                                <label>Registration Opens At (Optional)</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <DatePicker
                                            selected={formData.registration_open_time}
                                            onChange={date => {
                                                const newDate = formData.registration_open_time ? new Date(formData.registration_open_time) : new Date();
                                                if (date) {
                                                    newDate.setFullYear(date.getFullYear());
                                                    newDate.setMonth(date.getMonth());
                                                    newDate.setDate(date.getDate());
                                                }
                                                setFormData({ ...formData, registration_open_time: newDate });
                                            }}
                                            customInput={<CustomDateInput />}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            placeholderText="Select Date"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="time"
                                            value={formData.registration_open_time ? new Date(formData.registration_open_time).toTimeString().slice(0, 5) : ''}
                                            onChange={e => {
                                                const timeStr = e.target.value;
                                                if (timeStr) {
                                                    const [hours, mins] = timeStr.split(':');
                                                    const current = formData.registration_open_time ? new Date(formData.registration_open_time) : new Date();
                                                    current.setHours(parseInt(hours));
                                                    current.setMinutes(parseInt(mins));
                                                    setFormData({ ...formData, registration_open_time: current });
                                                }
                                            }}
                                            style={{
                                                padding: '0.8rem',
                                                background: '#333',
                                                border: '1px solid #444',
                                                borderRadius: '4px',
                                                color: 'white',
                                                width: '100%',
                                                colorScheme: 'dark'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={s.inputGroup}>
                                <label>Max Registrations (Optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.max_registrations}
                                    onChange={e => setFormData({ ...formData, max_registrations: e.target.value })}
                                    placeholder="Leave empty for unlimited"
                                    style={{ 
                                        padding: '0.8rem', 
                                        background: '#333', 
                                        color: 'white', 
                                        border: '1px solid #444', 
                                        borderRadius: '4px' 
                                    }}
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

                            <div className={s.inputGroup}>
                                <label>External Link (Optional)</label>
                                <input
                                    value={formData.registration_link}
                                    onChange={e => setFormData({ ...formData, registration_link: e.target.value })}
                                    placeholder="https://..."
                                />
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
                                    const ws = XLSX.utils.json_to_sheet(currentRegistrations.map(r => {
                                        const fullName = r.full_name || '-'
                                        const match = fullName.match(/^(.+?)\s*-\s*\[?([A-Z0-9.]+)\]?$/)
                                        const name = match ? match[1].trim() : fullName
                                        const rollNumber = match ? match[2].trim() : '-'
                                        
                                        return {
                                            Email: r.user_email,
                                            Name: name,
                                            'Roll Number': rollNumber,
                                            Date: new Date(r.created_at).toLocaleDateString(),
                                            Time: new Date(r.created_at).toLocaleTimeString()
                                        }
                                    }))
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
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                                    <thead style={{ background: '#222', position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Email</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Name</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Roll Number</th>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #444' }}>Registered At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRegistrations.map((reg, i) => {
                                            const fullName = reg.full_name || '-'
                                            const match = fullName.match(/^(.+?)\s*-\s*\[?([A-Z0-9.]+)\]?$/)
                                            const name = match ? match[1].trim() : fullName
                                            const rollNumber = match ? match[2].trim() : '-'
                                            
                                            return (
                                                <tr key={reg.id} style={{ borderBottom: '1px solid #333', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{reg.user_email}</td>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{name}</td>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{rollNumber}</td>
                                                    <td style={{ padding: '0.8rem 1rem' }}>{new Date(reg.created_at).toLocaleString()}</td>
                                                </tr>
                                            )
                                        })}
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
