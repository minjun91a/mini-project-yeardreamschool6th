const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.headers.authorization || '';
    const [schema, token] = header.split(' ');

    if (schema !== 'Bearer' || !token) {
        return res.status(401).json({
            success: false,
            data: {code: 'NO_TOKEN', message: '로그인이 필요합니다.'}
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        return next();
    } catch (e) {

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