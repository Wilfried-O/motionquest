import './App.css';
import { useEffect, useMemo, useState } from 'react';

import SearchBar from './components/SearchBar';
import MovieGrid from './components/MovieGrid';
import MovieModal from './components/MovieModal';
import AppHeader from './components/AppHeader';

import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';

import { searchMovies } from './services/tmdb';
import { LS_KEYS, SORT_BY, SORT_DIR, getYear, toNumber } from './utils/format';

export default function App() {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedQuery = useDebounce(query, 500); // 500ms delay

    // Persist favorites (array of movie IDs)
    const [favoriteIds, setFavoriteIds] = useLocalStorage(
        LS_KEYS.FAVORITES,
        []
    );
    const favSet = new Set(favoriteIds);

    const [showFavsOnly, setShowFavsOnly] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [sortBy, setSortBy] = useLocalStorage(
        LS_KEYS.SORT_BY,
        SORT_BY.RATING
    );
    const [sortDir, setSortDir] = useLocalStorage(
        LS_KEYS.SORT_DIR,
        SORT_DIR.DESC
    );

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

    // Sorting logic with stable tie-breakers.
    const sortedVisible = useMemo(() => {
        const arr = [...visibleResults];
        const dir = sortDir === SORT_DIR.DESC ? -1 : 1;

        function cmp(a, b) {
            const aVal =
                sortBy === SORT_BY.YEAR
                    ? getYear(a.release_date)
                    : toNumber(a.vote_average);
            const bVal =
                sortBy === SORT_BY.YEAR
                    ? getYear(b.release_date)
                    : toNumber(b.vote_average);

            // Always push missing values to the end (both directions)
            const aMissing = aVal == null;
            const bMissing = bVal == null;
            if (aMissing && !bMissing) return 1;
            if (!aMissing && bMissing) return -1;

            // If both present, compare numerically
            if (!aMissing && !bMissing && aVal !== bVal) {
                return aVal > bVal ? dir : -dir;
            }

            // Tie-breaker 1: popularity desc (missing treated as 0)
            const ap = toNumber(a.popularity) ?? 0;
            const bp = toNumber(b.popularity) ?? 0;
            if (ap !== bp) return ap > bp ? -1 : 1;

            // Tie-breaker 2: title A-Z
            const at = a.title ?? '';
            const bt = b.title ?? '';
            return at.localeCompare(bt);
        }

        arr.sort(cmp);
        return arr;
    }, [visibleResults, sortBy, sortDir]);

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

    const hasResults = results.length > 0;

    return (
        <div className="mq-container">
            <AppHeader title="MotionQuest" subtitle="" />

            <SearchBar
                value={query}
                onChange={setQuery}
                onClear={() => setQuery('')}
            />

            {hasResults && (
                <div className="mq-controls">
                    {' '}
                    <div
                        className="sortbar"
                        role="group"
                        aria-label="Sort results"
                    >
                        <span className="sort-label">Sort by</span>
                        <select
                            className="sort-select"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            aria-label="Sort by"
                        >
                            <option value={SORT_BY.RATING}>Rating</option>
                            <option value={SORT_BY.YEAR}>Year</option>
                        </select>

                        <button
                            type="button"
                            className="sort-dir-btn"
                            onClick={() =>
                                setSortDir(prev =>
                                    prev === SORT_DIR.ASC
                                        ? SORT_DIR.DESC
                                        : SORT_DIR.ASC
                                )
                            }
                            aria-label={`Sort direction: ${sortDir === SORT_DIR.ASC ? 'Ascending' : 'Descending'}`}
                            title={`Direction: ${sortDir.toUpperCase()}`}
                        >
                            {sortDir === SORT_DIR.ASC ? '↑' : '↓'}
                        </button>
                    </div>
                    <label className="fav-toggle">
                        <input
                            type="checkbox"
                            checked={showFavsOnly}
                            onChange={e => setShowFavsOnly(e.target.checked)}
                        />
                        Show favorites only
                    </label>
                </div>
            )}

            {/* render only one state at a time */}
            {isLoading ? (
                <p className="loading">Loading…</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : data ? (
                <MovieGrid
                    results={sortedVisible}
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
