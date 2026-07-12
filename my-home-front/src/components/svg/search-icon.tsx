interface Props {
  color1: string;
}

export default function SearchIcon({ color1 }: Props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10.5" cy="10.5" r="6.5" stroke={color1} strokeWidth="2" />
      <line
        x1="15.4142"
        y1="15.5"
        x2="21"
        y2="21.0858"
        stroke={color1}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
