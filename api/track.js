// /api/track.js
// Ghi nhận lượt view/click ẩn danh — gọi từ các trang public.
// KHÔNG đọc/lưu IP, User-Agent hay bất kỳ định danh cá nhân nào (spec mục 4).

module.exports = async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ message: 'Method Not Allowed' });
        }

        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { body = {}; }
        }
        const { page_name, event_type } = body || {};

        if (!page_name || typeof page_name !== 'string') {
            return res.status(400).json({ message: 'Thiếu page_name.' });
        }
        const ALLOWED_EVENT_TYPES = ['view', 'click'];
        const safeEventType = ALLOWED_EVENT_TYPES.includes(event_type) ? event_type : 'view';

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[track] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
            return res.status(500).json({ message: 'Lỗi cấu hình server.' });
        }

        // ===== ẨN DANH TUYỆT ĐỐI (spec mục 4) =====
        // Request này KHÔNG đọc req.headers['x-forwarded-for'] hay bất kỳ
        // thông tin định danh nào của người truy cập. Chỉ 2 giá trị được
        // gửi xuống DB: tên trang và loại sự kiện — không có gì để truy
        // ngược lại một người dùng cụ thể.
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_page_counter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ p_page_name: page_name, p_event_type: safeEventType }),
        });

        if (!rpcRes.ok) {
            console.error('[track] Supabase RPC lỗi:', rpcRes.status, await rpcRes.text());
            return res.status(502).json({ message: 'Không ghi nhận được lượt truy cập.' });
        }

        return res.status(204).end(); // không cần trả data gì cho client
    } catch (err) {
        console.error('[track] Lỗi không xác định:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};
