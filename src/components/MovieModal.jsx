import { useEffect, useRef, useState } from 'react';
import { getMovieDetails } from '../services/tmdb';
import { imageUrl, IMG_SIZES } from '../utils/images';

export default function MovieModal({ movieId, onClose }) {
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

    // ESC-to-close + move initial focus to the close button
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
        ? imageUrl(details.backdrop_path, IMG_SIZES.backdrop)
        : '';
    const poster = details?.poster_path
        ? imageUrl(details.poster_path, IMG_SIZES.poster)
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
