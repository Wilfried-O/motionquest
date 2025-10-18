export const LS_KEYS = {
    FAVORITES: 'motionquest:favs',
    SORT_BY: 'motionquest:sortBy',
    SORT_DIR: 'motionquest:sortDir',
};

export const SORT_BY = {
    RATING: 'rating',
    YEAR: 'year',
};

export const SORT_DIR = {
    ASC: 'asc',
    DESC: 'desc',
};

export function getYear(release_date) {
    if (
        !release_date ||
        typeof release_date !== 'string' ||
        release_date.length < 4
    )
        return null;
    const y = Number(release_date.slice(0, 4));
    return Number.isFinite(y) ? y : null;
}

export function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}
