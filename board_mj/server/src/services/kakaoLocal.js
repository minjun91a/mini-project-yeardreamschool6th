const KAKAO_LOCAL_BASE_URL = 'https://dapi.kakao.com';

const SEOUL_GYEONGGI_PREFIXES = [
    '서울',
    '서울특별시',
    '경기',
    '경기도'
];

const CATEGORY_GROUP_TO_PLACE_CATEGORY = {
    CE7: 'cafe',
    FD6: 'restaurant',
    CT1: 'culture',
    AT4: 'culture'
};

function requireFetch() {
    if (typeof fetch !== 'function') {
        const error = new Error('현재 Node 런타임에서 fetch를 사용할 수 없습니다. Node 20 이상에서 실행해 주세요.');
        error.status = 500;
        error.code = 'FETCH_UNAVAILABLE';
        throw error;
    }
}

function getRestApiKey() {
    return process.env.KAKAO_REST_API_KEY ||
        process.env.KAKAO_LOCAL_REST_API_KEY;
}

function normalizeText(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    return normalized || null;
}

function parseNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function clampInteger(value, {
    defaultValue,
    min,
    max
}) {
    const number = Number.parseInt(value, 10);

    if (!Number.isFinite(number)) {
        return defaultValue;
    }

    return Math.min(Math.max(number, min), max);
}

function isSupportedRegion(address) {
    if (typeof address !== 'string') {
        return false;
    }

    return SEOUL_GYEONGGI_PREFIXES.some(
        (prefix) => address.startsWith(prefix)
    );
}

function inferCategory(document) {
    const groupCode = document.category_group_code;

    if (CATEGORY_GROUP_TO_PLACE_CATEGORY[groupCode]) {
        return CATEGORY_GROUP_TO_PLACE_CATEGORY[groupCode];
    }

    const categoryName = document.category_name || '';

    if (categoryName.includes('카페')) {
        return 'cafe';
    }

    if (
        categoryName.includes('음식') ||
        categoryName.includes('식당') ||
        categoryName.includes('한식') ||
        categoryName.includes('일식') ||
        categoryName.includes('중식') ||
        categoryName.includes('양식')
    ) {
        return 'restaurant';
    }

    if (
        categoryName.includes('술집') ||
        categoryName.includes('호프') ||
        categoryName.includes('바,칵테일')
    ) {
        return 'bar';
    }

    if (
        categoryName.includes('공원') ||
        categoryName.includes('광장')
    ) {
        return 'park';
    }

    if (
        categoryName.includes('문화') ||
        categoryName.includes('전시') ||
        categoryName.includes('공연') ||
        categoryName.includes('영화')
    ) {
        return 'culture';
    }

    if (
        categoryName.includes('쇼핑') ||
        categoryName.includes('백화점') ||
        categoryName.includes('복합쇼핑몰')
    ) {
        return 'shopping';
    }

    return 'other';
}

function normalizeKakaoPlace(document) {
    const longitude = parseNumber(document.x);
    const latitude = parseNumber(document.y);
    const address = document.address_name || '';
    const roadAddress = document.road_address_name || '';

    return {
        provider: 'kakao',
        externalPlaceId: document.id,
        name: document.place_name,
        normalizedName: normalizeText(document.place_name),
        category: inferCategory(document),
        address,
        roadAddress: roadAddress || null,
        location: {
            type: 'Point',
            coordinates: [
                longitude,
                latitude
            ]
        },
        phone: document.phone || null,
        placeUrl: document.place_url || null,
        rawCategory: document.category_name || null,
        categoryGroupCode: document.category_group_code || null,
        categoryGroupName: document.category_group_name || null,
        distance: document.distance ? Number(document.distance) : null,
        withinServiceArea: isSupportedRegion(address) ||
            isSupportedRegion(roadAddress)
    };
}

function assertValidCoordinates({longitude, latitude}) {
    if (
        longitude == null &&
        latitude == null
    ) {
        return;
    }

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
    ) {
        const error = new Error('검색 중심 좌표가 올바르지 않습니다.');
        error.status = 400;
        error.code = 'INVALID_COORDINATES';
        throw error;
    }
}

async function searchKeyword({
    query,
    longitude,
    latitude,
    radius,
    rect,
    page,
    size,
    sort,
    includeUnsupported = false
}) {
    requireFetch();

    const restApiKey = getRestApiKey();

    if (!restApiKey) {
        const error = new Error('Kakao Local REST API 키가 설정되어 있지 않습니다.');
        error.status = 503;
        error.code = 'KAKAO_API_KEY_MISSING';
        throw error;
    }

    const trimmedQuery = typeof query === 'string'
        ? query.trim()
        : '';

    if (!trimmedQuery) {
        const error = new Error('검색어는 필수입니다.');
        error.status = 400;
        error.code = 'QUERY_REQUIRED';
        throw error;
    }

    const normalizedLongitude = parseNumber(longitude);
    const normalizedLatitude = parseNumber(latitude);

    assertValidCoordinates({
        longitude: normalizedLongitude,
        latitude: normalizedLatitude
    });

    const params = new URLSearchParams({
        query: trimmedQuery,
        page: String(clampInteger(page, {
            defaultValue: 1,
            min: 1,
            max: 45
        })),
        size: String(clampInteger(size, {
            defaultValue: 15,
            min: 1,
            max: 15
        }))
    });

    if (
        Number.isFinite(normalizedLongitude) &&
        Number.isFinite(normalizedLatitude)
    ) {
        params.set('x', String(normalizedLongitude));
        params.set('y', String(normalizedLatitude));

        const normalizedRadius = clampInteger(radius, {
            defaultValue: 20000,
            min: 1,
            max: 20000
        });

        params.set('radius', String(normalizedRadius));
    }

    if (typeof rect === 'string' && rect.trim()) {
        params.set('rect', rect.trim());
    }

    if (sort === 'distance' || sort === 'accuracy') {
        params.set('sort', sort);
    }

    const response = await fetch(
        `${KAKAO_LOCAL_BASE_URL}/v2/local/search/keyword.json?${params}`,
        {
            headers: {
                Authorization: `KakaoAK ${restApiKey}`
            }
        }
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(
            body?.msg || 'Kakao Local 장소 검색에 실패했습니다.'
        );

        error.status = response.status;
        error.code = 'KAKAO_LOCAL_ERROR';
        error.details = body;
        throw error;
    }

    const places = (body.documents || [])
        .map(normalizeKakaoPlace)
        .filter((place) => {
            return includeUnsupported || place.withinServiceArea;
        });

    return {
        meta: body.meta,
        places
    };
}

module.exports = {
    normalizeKakaoPlace,
    normalizeText,
    searchKeyword
};
