const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.headers.authorization || '';
    const [schema, token] = header.split(' ');

    console.log('[DEBUG] auth header:', {schema, hasToken: !!token});

    if (schema !== 'Bearer' || !token) {
        return res.status(401).json({
            success: false,
            data: {code: 'NO_TOKEN', message: '로그인이 필요합니다.'}
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[DEBUG] token payload:', req.user);

        return next();
    } catch (e) {
        console.log('[DEBUG] 토큰 검증 실패:', e.name, e.message);

        const expired = e.name === 'tokenExpiredError';
        return res.status(401).json({
            success: false,
            error: {
                code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
                message: expired ? '로그인이 만료되었습니다.' : '유효하지 않은 토큰입니다.'
            }
        });
    }
};