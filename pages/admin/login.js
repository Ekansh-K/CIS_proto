import { useState } from 'react'
import { supabaseAdmin } from 'lib/supabase'
import { useRouter } from 'next/router'
import { Button } from 'components/button'
import s from './admin.module.scss'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Login failed')
            }

            // Save the session to the segregated Admin storage
            await supabaseAdmin.auth.setSession(data.session)

            router.push('/admin')
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className={s.loginPage}>
            <div className={s.loginContainer}>
                <h1 className="h3">Admin Login</h1>
                <form onSubmit={handleLogin} className={s.form}>
                    <div className={s.inputGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={s.inputGroup}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className={s.error}>{error}</p>}
                    <Button type="submit" className={s.submitBtn} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
