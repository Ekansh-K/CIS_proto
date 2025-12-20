import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    // 1. Secure Server-Side Validation against Environment Variables
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
        console.error('Admin credentials not set in server environment')
        return res.status(500).json({ error: 'Server configuration error' })
    }

    if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    // 2. Authenticate with Supabase to get a valid session for RLS
    // We use a temporary server-side client to perform the login
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Supabase Login Error:', error)
        return res.status(401).json({ error: 'Database authentication failed: ' + error.message })
    }

    // 3. Return the session to the client
    return res.status(200).json({ session: data.session })
}
