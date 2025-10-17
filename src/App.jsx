// App.jsx
import './App.css';
import { useEffect, useState } from 'react';

import SearchBar from './components/SearchBar';
import MovieGrid from './components/MovieGrid';
import MovieModal from './components/MovieModal';

import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';

import { searchMovies } from './services/tmdb';
import { LS_KEYS } from './utils/format';

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
                <MovieGrid
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
