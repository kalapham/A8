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
        // BẢO MẬT SERVER-SIDE (bắt buộc — spec mục 3)
        // Verify JWT NGAY TỪ ĐẦU, trước khi chạm vào bất kỳ dữ liệu nào.
        // Thiếu cookie / sai chữ ký / hết hạn / giả mạo -> 401 và DỪNG
        // NGAY. Không có nhánh nào bên dưới trả data trong các trường
        // hợp này — bất kể frontend đã "tự kiểm tra" hay chưa.
        // ============================================================
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error('[admin/analytics] Thiếu JWT_SECRET.');
            return res.status(500).json({ message: 'Lỗi cấu hình server.' });
        }

        const token = getCookie(req, 'session');
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập.' });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        // ===== HẾT PHẦN BẢO MẬT — từ đây chắc chắn request đã xác thực =====

        // ----- Mock data — sẽ thay bằng query Supabase (analytics_logs) ở bước sau -----
        const mockData = {
            views: [
                { page: 'index.html', count: 150 },
                { page: 'documents.html', count: 95 },
                { page: 'gallery.html', count: 60 },
                { page: 'guestbook.html', count: 40 },
                { page: 'classlist.html', count: 35 },
                { page: 'events.html', count: 28 },
            ],
            totalClicks: 12,
        };

        return res.status(200).json(mockData);

    } catch (err) {
        console.error('[admin/analytics] Lỗi không xác định:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};
