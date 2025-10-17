import './App.css';
import { useEffect, useRef, useState } from 'react';

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

async function getMovieDetails(id) {
    const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
    if (!API_KEY) throw new Error('Missing REACT_APP_TMDB_API_KEY');
    const API_BASE = 'https://api.themoviedb.org/3';
    const url = `${API_BASE}/movie/${id}?api_key=${API_KEY}&language=en-US`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return res.json();
}

function posterUrl(path, size = 'w342') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

function backdropUrl(path, size = 'w780') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

function MovieItem({ movie, isFavorite, onToggleFavorite, onOpen }) {
    const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
    const rating =
        movie.vote_average != null
            ? Number(movie.vote_average).toFixed(1)
            : '—';
    const poster = posterUrl(movie.poster_path, 'w342');

    return (
        <li
            className="movie-card"
            onClick={() => onOpen(movie.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter') onOpen(movie.id);
            }}
        >
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
                    onClick={e => {
                        e.stopPropagation(); // don't open modal when toggling favorite
                        onToggleFavorite(movie.id);
                    }}
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

function MovieList({ results, favSet, onToggleFavorite, onOpen }) {
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
                    onOpen={onOpen}
                />
            ))}
        </ul>
    );
}

function MovieModal({ movieId, onClose }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const closeBtnRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setDetails(null);

        getMovieDetails(movieId)
            .then(json => {
                if (!cancelled) setDetails(json);
            })
            .catch(err => {
                if (!cancelled)
                    setError(err.message || 'Failed to load details');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [movieId]);

    // ESC to close + initial focus
    useEffect(() => {
        const onKey = e => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
        return () => {
            document.removeEventListener('keydown', onKey);
            clearTimeout(t);
        };
    }, [onClose]);

    const backdrop = details?.backdrop_path
        ? backdropUrl(details.backdrop_path)
        : '';
    const poster = details?.poster_path
        ? posterUrl(details.poster_path, 'w342')
        : '';
    const year = details?.release_date ? details.release_date.slice(0, 4) : '—';
    const rating =
        details?.vote_average != null
            ? Number(details.vote_average).toFixed(1)
            : '—';
    const runtime = details?.runtime ? `${details.runtime} min` : '—';
    const genres = details?.genres?.map(g => g.name).join(', ') || '—';

    function handleOverlayClick(e) {
        if (e.target === overlayRef.current) onClose(); // click outside to close
    }

    return (
        <div
            className="mq-modal-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
            aria-modal="true"
            role="dialog"
            aria-labelledby="mq-modal-title"
        >
            <div className="mq-modal">
                <div
                    className="mq-modal-hero"
                    style={
                        backdrop
                            ? { backgroundImage: `url(${backdrop})` }
                            : undefined
                    }
                >
                    <button
                        ref={closeBtnRef}
                        className="mq-close-btn"
                        type="button"
                        onClick={onClose}
                        aria-label="Close details"
                        title="Close"
                    >
                        x
                    </button>
                </div>

                <div className="mq-modal-body">
                    {loading && <p className="loading">Loading details…</p>}
                    {error && <p className="error">{error}</p>}
                    {!loading && !error && details && (
                        <div className="mq-modal-grid">
                            <div className="mq-modal-poster">
                                {poster ? (
                                    <img
                                        src={poster}
                                        alt={`${details.title} poster`}
                                        className="poster"
                                    />
                                ) : (
                                    <div
                                        className="poster poster-fallback"
                                        style={{ aspectRatio: '2 / 3' }}
                                    >
                                        No Image
                                    </div>
                                )}
                            </div>

                            <div className="mq-modal-content">
                                <h2
                                    id="mq-modal-title"
                                    className="mq-modal-title"
                                >
                                    {details.title}{' '}
                                    <span className="mq-year">({year})</span>
                                </h2>

                                <div className="mq-meta-row">
                                    <span>⭐ {rating}</span>
                                    <span>•</span>
                                    <span>{runtime}</span>
                                    <span>•</span>
                                    <span>{genres}</span>
                                </div>

                                <p className="mq-overview">
                                    {details.overview ||
                                        'No overview available.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
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

    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        const q = debouncedQuery.trim();

        if (q.length < 2) {
            setData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        setData(null); // clear previous results immediately
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

    // Toggle favorite ID and persist to local storage
    function handleToggleFavorite(id) {
        setFavoriteIds(prev => {
            const set = new Set(prev);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            return Array.from(set);
        });
    }

    function openModal(id) {
        setSelectedId(id);
        document.body.style.overflow = 'hidden'; // lock scroll
    }
    function closeModal() {
        setSelectedId(null);
        document.body.style.overflow = ''; // restore scroll
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

            {/* render only one state at a time */}
            {isLoading ? (
                <p className="loading">Loading…</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : data ? (
                <MovieList
                    results={visibleResults}
                    favSet={favSet}
                    onToggleFavorite={handleToggleFavorite}
                    onOpen={openModal}
                />
            ) : (
                <p className="help-text">Type at least 2 characters…</p>
            )}

            {selectedId !== null && (
                <MovieModal movieId={selectedId} onClose={closeModal} />
            )}
        </div>
    );
}
