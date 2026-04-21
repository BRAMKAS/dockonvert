export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DocKonvert logo"
    >
      <rect width="48" height="48" rx="12" fill="url(#grad)" />
      <path
        d="M12 14h8a2 2 0 012 2v16a2 2 0 01-2 2h-8a2 2 0 01-2-2V16a2 2 0 012-2z"
        fill="#fff"
        opacity="0.9"
      />
      <path d="M14 20h4M14 24h4M14 28h2" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M26 18l6 6-6 6"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 14h4v4M34 34h4v-4"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
