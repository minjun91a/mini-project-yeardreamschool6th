module.exports = (err, req, res, next) => {
    console.error('=== ERROR ===');
    console.error('경로:', req.method, req.originalUrl);
    console.error('종류:', err.name, '| 코드:', err.code);
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        const first = Object.values(err.errors)[0];
        return res.status(400).json({
            success: false,
            error: {code: 'VALIDATION', message: first.message}
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: {code: 'INVALID_ID', message: '잘못된 형식의 ID입니다.'}
        });
    }
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            error: {code: 'DUPLICATE', message: '이미 사용 중인 값입니다.'}
        });
    }

    console.error('[미분류 에러]', err.name);

    return res.status(err.status || 500).json({
        success: false,
        error: {code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.'}
    });
};