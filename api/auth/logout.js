// /api/auth/logout.js
// Không cần verify token trước khi xoá — hành động logout luôn được phép,
// dù token còn hạn hay đã hỏng.
module.exports = async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ message: 'Method Not Allowed' });
        }

        res.setHeader('Set-Cookie', [
            'session=', 'HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=0',
        ].join('; '));

        return res.status(200).json({ message: 'Đã đăng xuất' });
    } catch (err) {
        console.error('[auth/logout] Lỗi:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};
