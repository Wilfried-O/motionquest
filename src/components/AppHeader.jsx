export default function AppHeader({
    title = 'MotionQuest',
    subtitle = 'Search a Movie', // may not keep this
}) {
    return (
        <header className="mq-header">
            <div className="brand" aria-label={title}>
                <div className="brand-mark">
                    <Logo size={36} />
                </div>

                <div className="brand-col">
                    <h1 className="brand-text">{title}</h1>
                    {subtitle ? (
                        <div className="brand-sub">{subtitle}</div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}

function Logo({ size = 24 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            role="img"
            aria-label="MotionQuest logo"
        >
            <defs>
                <linearGradient id="mqg3" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#7c3aed" />
                    <stop offset="1" stopColor="#00d4ff" />
                </linearGradient>
            </defs>
            <rect
                x="1.5"
                y="1.5"
                width="29"
                height="29"
                rx="7"
                fill="none"
                stroke="url(#mqg3)"
                strokeWidth="2"
            />
            <path
                d="M8 22V10l4.5 6 4.5-6v12"
                fill="none"
                stroke="#000821"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M22 12l3 4-3 4"
                fill="none"
                stroke="url(#mqg3)"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
