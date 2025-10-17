import MovieCard from './MovieCard';

export default function MovieGrid({
    results,
    favSet,
    onToggleFavorite,
    onOpen,
}) {
    if (!Array.isArray(results) || results.length === 0) {
        return <p>No results.</p>;
    }
    return (
        <ul className="movie-grid">
            {results.map(m => (
                <MovieCard
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
