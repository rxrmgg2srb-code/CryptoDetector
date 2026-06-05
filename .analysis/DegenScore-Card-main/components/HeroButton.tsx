import React from 'react';

type Props = {
  href?: string;
  children?: React.ReactNode;
};

export default function HeroButton({
  href = '/api/generate-card',
  children = 'Mint Your DegenCard Now & Appear Here! →',
}: Props) {
  return (
    <a
      href={href}
      className="btn-hero inline-flex items-center justify-center"
      style={{
        background: 'linear-gradient(90deg,#5eead4,#7c3aed,#ff6fd8)',
        paddingLeft: 36,
        paddingRight: 36,
        borderRadius: 999,
      }}
    >
      <span style={{ marginRight: 10 }}>{children}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="inline-block">
        <path
          d="M5 12h14"
          stroke="#05060a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 5l7 7-7 7"
          stroke="#05060a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
