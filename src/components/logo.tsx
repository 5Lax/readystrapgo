import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
}

function BuckleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer frame of buckle */}
      <rect x="3" y="6" width="18" height="12" rx="2" />
      {/* Inner release mechanism */}
      <path d="M8 6v12" />
      <path d="M8 10h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8" />
      {/* Release button detail */}
      <circle cx="17" cy="12" r="1.5" />
    </svg>
  );
}

export function Logo({ size = "md", asLink = true }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "h-5 w-5",
      text: "text-base",
      gap: "gap-1.5",
    },
    md: {
      icon: "h-6 w-6",
      text: "text-xl",
      gap: "gap-2",
    },
    lg: {
      icon: "h-8 w-8",
      text: "text-2xl",
      gap: "gap-2.5",
    },
  };

  const classes = sizeClasses[size];

  const content = (
    <span className={`flex items-center ${classes.gap}`}>
      <BuckleIcon className={`${classes.icon} text-primary`} />
      <span className={`${classes.text} font-bold tracking-tight`}>
        <span className="text-muted-foreground">Ready</span>
        <span className="text-muted-foreground/60 mx-0.5">·</span>
        <span className="text-primary font-extrabold">Strap</span>
        <span className="text-muted-foreground/60 mx-0.5">·</span>
        <span className="text-muted-foreground">Go</span>
      </span>
    </span>
  );

  if (asLink) {
    return (
      <Link href="/" className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
