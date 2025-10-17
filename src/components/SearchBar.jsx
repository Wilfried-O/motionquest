export default function SearchBar({ value, onChange, onClear }) {
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
