import './App.css';

import { useEffect, useState } from 'react';

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
                    ×
                </button>
            ) : null}
        </div>
    );
}

function useDebounce(value, delay = 1000) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay); // wait for pause
        return () => clearTimeout(id); // reset timer
    }, [value, delay]);
    return debounced;
}

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

export default function App() {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedQuery = useDebounce(query);

    useEffect(() => {
        const q = debouncedQuery.trim();

        // if empty/short, reset and skip
        if (q.length < 2) {
            setData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false; // ignore late responses
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
            cancelled = true; // mark this run obsolete
        };
    }, [debouncedQuery]);

    return (
        <div>
            <h1>MotionQuest</h1>

            <SearchBar
                value={query}
                onChange={setQuery} // controlled input
                onClear={() => setQuery('')} // clear helper
            />

            {isLoading && <p>Loading…</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}

            <pre style={{ whiteSpace: 'pre-wrap' }}>
                {data
                    ? JSON.stringify(data, null, 2)
                    : 'Type at least 2 characters…'}
            </pre>
        </div>
    );
}
