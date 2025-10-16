import { useEffect, useState } from 'react';

// Inline SearchBar
//
function SearchBar({ value, onChange, onClear }) {
    return (
        <div>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Search movies…"
                aria-label="Search movies"
            />
            {value ? (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label="Clear search"
                >
                    X
                </button>
            ) : null}
        </div>
    );
}

// Inline useDebounce
//
function useDebounce(value, delay = 1000) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

// TMDB search (v3)
//
async function searchMovies(query, page = 1) {
    const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
    if (!API_KEY) throw new Error('Missing REACT_APP_TMDB_API_KEY');

    const API_BASE = 'https://api.themoviedb.org/3';
    const url =
        `${API_BASE}/search/movie?api_key=${API_KEY}` +
        `&query=${encodeURIComponent(query)}` +
        `&page=${page}&include_adult=false&language=en-US`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return res.json();
}

// Tiny image URL helper (hardcode a common size; fine for now)
//
function posterUrl(path, size = 'w185') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

// Simple movie item (poster, title, year, rating)
//
function MovieItem({ movie }) {
    const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
    const rating =
        movie.vote_average != null
            ? Number(movie.vote_average).toFixed(1)
            : '—';
    const poster = posterUrl(movie.poster_path, 'w185');

    return (
        <li
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '12px',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #2222',
            }}
        >
            {poster ? (
                <img
                    src={poster}
                    alt={`${movie.title} poster`}
                    width={80}
                    height={120}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    loading="lazy"
                />
            ) : (
                <div
                    style={{
                        width: 80,
                        height: 120,
                        background: '#4444',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#bbb',
                    }}
                    aria-hidden="true"
                >
                    No Image
                </div>
            )}

            <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 600 }}>{movie.title}</div>
                <div style={{ opacity: 0.85, fontSize: 14 }}>
                    {year} • ⭐ {rating}
                </div>
            </div>
        </li>
    );
}

function MovieList({ results }) {
    if (!Array.isArray(results) || results.length === 0) {
        return <p>No results.</p>;
    }
    return (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
            {results.map(m => (
                <MovieItem key={m.id} movie={m} />
            ))}
        </ul>
    );
}

export default function App() {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedQuery = useDebounce(query); // 1s debounce

    useEffect(() => {
        const q = debouncedQuery.trim();

        if (q.length < 2) {
            setData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        searchMovies(q, 1)
            .then(json => {
                if (cancelled) return;
                setData(json);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err.message || 'Failed to load');
                setData(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    const results = data?.results ?? [];

    return (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
            <h1>MotionQuest — Search</h1>

            <SearchBar
                value={query}
                onChange={setQuery}
                onClear={() => setQuery('')}
            />

            {isLoading && <p>Loading…</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}

            {data ? (
                <MovieList results={results} />
            ) : (
                <p>Type at least 2 characters…</p>
            )}
        </div>
    );
}
