// Lily pad mark: a round leaf with the classic notch, plus faint veins.
export default function LilyPad({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12 L21.85 10.26 A10 10 0 1 1 18.43 4.34 Z" fill="currentColor" />
      <path
        d="M12 12 L5 7 M12 12 L4.5 15.5 M12 12 L11 21 M12 12 L18 19"
        stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55"
      />
    </svg>
  )
}