import { createClient } from '@supabase/supabase-js'

// Simple in-memory rate limiting (use Redis in production for distributed systems)
const loginAttempts = new Map()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

function isRateLimited(ip) {
    const now = Date.now()
    const attempts = loginAttempts.get(ip)
    
    if (!attempts) return false
    
    // Clean up old entries
    if (now - attempts.firstAttempt > LOCKOUT_TIME) {
        loginAttempts.delete(ip)
        return false
    }
    
    return attempts.count >= MAX_ATTEMPTS
}

function recordAttempt(ip, success) {
    if (success) {
        loginAttempts.delete(ip)
        return
    }
    
    const now = Date.now()
    const attempts = loginAttempts.get(ip)
    
    if (!attempts) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now })
    } else {
        attempts.count++
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get client IP for rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket?.remoteAddress || 
               'unknown'

    // Check rate limiting
    if (isRateLimited(ip)) {
        return res.status(429).json({ 
            error: 'Too many login attempts. Please try again in 15 minutes.' 
        })
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
        recordAttempt(ip, false) // Record failed attempt
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
        recordAttempt(ip, false) // Record failed attempt
        console.error('Supabase Login Error:', error)
        return res.status(401).json({ error: 'Database authentication failed: ' + error.message })
    }

    // Clear rate limiting on successful login
    recordAttempt(ip, true)

    // 3. Return the session to the client
    return res.status(200).json({ session: data.session })
}
