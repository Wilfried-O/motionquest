import { imageUrl, IMG_SIZES } from '../utils/images';

export default function MovieCard({
    movie,
    isFavorite,
    onToggleFavorite,
    onOpen,
}) {
    const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
    const rating =
        movie.vote_average != null
            ? Number(movie.vote_average).toFixed(1)
            : '—';

    const poster = imageUrl(movie.poster_path, IMG_SIZES.poster);

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
