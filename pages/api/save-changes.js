import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const filePath = path.join(process.cwd(), 'public', 'world-changes.json')
            fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2))
            res.status(200).json({ success: true })
        } catch (e) {
            res.status(500).json({ error: e.message })
        }
    } else {
        res.status(200).json({ status: 'ok' })
    }
}
