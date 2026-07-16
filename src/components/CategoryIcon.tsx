import type { CategoryIcon as IconName } from "@/config/categories";

const paths: Record<IconName, string> = {
  brain:
    "M12 3a4 4 0 0 0-4 4v.35A4.5 4.5 0 0 0 5 11.5c0 1.2.47 2.3 1.24 3.1A4 4 0 0 0 10 21h4a4 4 0 0 0 3.76-6.4A4.48 4.48 0 0 0 19 11.5a4.5 4.5 0 0 0-3-4.15V7a4 4 0 0 0-4-4Zm0 4v10",
  apps: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  chip: "M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 4h4v4h-4z",
  briefcase:
    "M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1m-8 0h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm-2 6h14",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 1 2-2h13M8 7h7",
  scale:
    "M12 3v18m-7 0h14M12 6h7l-2-3m2 3-3 6a3 3 0 0 0 6 0l-3-6M12 6H5l2-3M5 6l-3 6a3 3 0 0 0 6 0L5 6",
  newspaper:
    "M4 5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v14H6a2 2 0 0 1-2-2V5Zm13 4h2a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4",
};

export function CategoryIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[icon]} />
    </svg>
  );
}
