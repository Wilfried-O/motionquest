const IMAGE_BASE = process.env.REACT_APP_TMDB_IMAGE_BASE;

export const IMG_SIZES = {
    poster: 'w342',
    backdrop: 'w780',
};

export function imageUrl(path, size = IMG_SIZES.poster) {
    if (!IMAGE_BASE) throw new Error('Missing REACT_APP_TMDB_IMAGE_BASE');

    return path ? `${IMAGE_BASE}${size}${path}` : '';
}
