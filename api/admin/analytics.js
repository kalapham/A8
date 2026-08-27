// /api/admin/analytics.js
const jwt = require('jsonwebtoken');

function getCookie(req, name) {
    const raw = req.headers.cookie || '';
    const match = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

module.exports = async function handler(req, res) {
    try {
        if (req.method !== 'GET') {
            res.setHeader('Allow', 'GET');
            return res.status(405).json({ message: 'Method Not Allowed' });
        }

        // ============================================================
        // BẢO MẬT SERVER-SIDE — GIỮ NGUYÊN như cũ (spec mục 3)
        // ============================================================
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error('[admin/analytics] Thiếu JWT_SECRET.');
            return res.status(500).json({ message: 'Lỗi cấu hình server.' });
        }
        const token = getCookie(req, 'session');
        if (!token) return res.status(401).json({ message: 'Chưa đăng nhập.' });
        try {
            jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        // ===== HẾT PHẦN BẢO MẬT =====

        // ----- Lấy dữ liệu THẬT từ Supabase (thay cho mock data) -----
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[admin/analytics] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
            return res.status(500).json({ message: 'Lỗi cấu hình server.' });
        }

        const dbRes = await fetch(
            `${SUPABASE_URL}/rest/v1/analytics_logs?select=page_name,view_count,click_count`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            }
        );

        if (!dbRes.ok) {
            console.error('[admin/analytics] Supabase REST lỗi:', dbRes.status, await dbRes.text());
            return res.status(502).json({ message: 'Không lấy được dữ liệu từ database.' });
        }

        const rows = await dbRes.json(); // [{ page_name, view_count, click_count }, ...]

        // Giữ nguyên đúng shape mà dashboard.html đang render — không cần sửa gì ở dashboard.
        const views = rows.map(r => ({ page: r.page_name, count: Number(r.view_count) }));
        const totalClicks = rows.reduce((sum, r) => sum + Number(r.click_count), 0);

        return res.status(200).json({ views, totalClicks });

    } catch (err) {
        console.error('[admin/analytics] Lỗi không xác định:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};
