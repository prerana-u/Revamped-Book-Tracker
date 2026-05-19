export default function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4">
      <rect
        x="3"
        y="2"
        width="10"
        height="12"
        rx="1"
        ry="1"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="8.5"
        x2="10"
        y2="8.5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="11"
        x2="9"
        y2="11"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <polyline
        points="10,2 10,5 13,5"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
