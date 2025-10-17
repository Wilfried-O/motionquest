const API_BASE = process.env.REACT_APP_TMDB_API_BASE;
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

function requireKey() {
    if (!API_KEY) throw new Error('Missing REACT_APP_TMDB_API_KEY');
    return API_KEY;
}

function buildUrl(path, params = {}) {
    const url = new URL(API_BASE + path);

    url.searchParams.set('api_key', requireKey());
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    return url.toString();
}

async function tmdbGet(path, params) {
    const res = await fetch(buildUrl(path, params));
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return res.json();
}

export function searchMovies(query, page = 1, language = 'en-US') {
    return tmdbGet('/search/movie', {
        query,
        page,
        include_adult: 'false',
        language,
    });
}

export function getMovieDetails(id, language = 'en-US') {
    return tmdbGet(`/movie/${id}`, { language });
}
