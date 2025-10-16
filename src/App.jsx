import './App.css';
import { useEffect, useState } from 'react';

function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : initialValue;
        } catch {
            return initialValue;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /*do nothing*/
        }
    }, [key, value]);
    return [value, setValue];
}

function SearchBar({ value, onChange, onClear }) {
    return (
        <div className="searchbar">
            <input
                className="search-input"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Type a movie name"
                aria-label="Search movies"
            />
            {value ? (
                <button
                    className="clear-btn"
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

function useDebounce(value, delay = 1000) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

// TMDB search (v3)
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

// image URL helper (hardcode a common size; OK for now)
function posterUrl(path, size = 'w342') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

// Movie card
function MovieItem({ movie, isFavorite, onToggleFavorite }) {
    const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
    const rating =
        movie.vote_average != null
            ? Number(movie.vote_average).toFixed(1)
            : '—';
    const poster = posterUrl(movie.poster_path, 'w342');

    return (
        <li className="movie-card">
            {poster ? (
                <img
                    className="poster poster-cover"
                    src={poster}
                    alt={`${movie.title} poster`}
                    loading="lazy"
                />
            ) : (
                <div
                    className="poster poster-fallback poster-cover"
                    aria-hidden="true"
                >
                    No Image
                </div>
            )}

            <div className="card-body">
                <div className="movie-title clamp-2">{movie.title}</div>
                <div className="movie-meta">
                    {year} • ⭐ {rating}
                </div>

                <button
                    type="button"
                    className={`fav-chip ${isFavorite ? 'active' : ''}`}
                    onClick={() => onToggleFavorite(movie.id)}
                    aria-pressed={isFavorite}
                    aria-label={
                        isFavorite
                            ? 'Remove from favorites'
                            : 'Add to favorites'
                    }
                    title={isFavorite ? 'Remove from favorites' : ''}
                >
                    {isFavorite ? '♥' : 'Add to favorites'}
                </button>
            </div>
        </li>
    );
}

function MovieList({ results, favSet, onToggleFavorite }) {
    if (!Array.isArray(results) || results.length === 0) {
        return <p>No results.</p>;
    }
    return (
        <ul className="movie-grid">
            {results.map(m => (
                <MovieItem
                    key={m.id}
                    movie={m}
                    isFavorite={favSet.has(m.id)}
                    onToggleFavorite={onToggleFavorite}
                />
            ))}
        </ul>
    );
}

export default function App() {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedQuery = useDebounce(query, 500); // 500ms delay

    // Persist favorites (array of movie IDs)
    const [favoriteIds, setFavoriteIds] = useLocalStorage(
        'motionquest:favs',
        []
    );
    const favSet = new Set(favoriteIds);

    const [showFavsOnly, setShowFavsOnly] = useState(false);

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

    const visibleResults = !showFavsOnly
        ? results
        : results.filter(m => favSet.has(m.id));

    // Toggle favorite ID and persist
    function handleToggleFavorite(id) {
        setFavoriteIds(prev => {
            const set = new Set(prev);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            return Array.from(set);
        });
    }

    return (
        <div className="mq-container">
            <h1>MotionQuest — Search a Movie</h1>

            <SearchBar
                value={query}
                onChange={setQuery}
                onClear={() => setQuery('')}
            />

            {results.length > 0 && (
                <label className="fav-toggle">
                    <input
                        type="checkbox"
                        checked={showFavsOnly}
                        onChange={e => setShowFavsOnly(e.target.checked)}
                    />
                    Show favorites only
                </label>
            )}

            {isLoading && <p className="loading">Loading…</p>}
            {error && <p className="error">{error}</p>}
            {data ? (
                <MovieList
                    results={visibleResults}
                    favSet={favSet}
                    onToggleFavorite={handleToggleFavorite}
                />
            ) : (
                <p className="help-text">Type at least 2 characters…</p>
            )}
        </div>
    );
}
