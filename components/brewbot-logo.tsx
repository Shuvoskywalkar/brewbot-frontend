type BrewBotLogoProps = {
  className?: string
}

export function BrewBotLogo({ className = "" }: BrewBotLogoProps) {
  return (
    <span className={`brewbot-logo ${className}`.trim()}>
      <svg className="brewbot-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9h11v7a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
        <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M11.5 5v3" />
        <circle cx="11.5" cy="4" r="1.5" />
        <circle className="brewbot-eye" cx="10" cy="13" r=".7" />
        <circle className="brewbot-eye" cx="14" cy="13" r=".7" />
      </svg>
      <span className="brewbot-word">Brew<span>Bot</span></span>
    </span>
  )
}
