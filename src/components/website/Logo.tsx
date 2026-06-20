import Link from 'next/link';

interface LogoProps {
  height?: number;
  href?: string;
}

const LOGO_ASPECT = 9136 / 4813;

export default function Logo({ height = 84, href }: LogoProps) {
  const width = Math.round(height * LOGO_ASPECT);

  const image = (
    <img
      src="/arcom-logo-sm.png"
      alt="Arcom Developments"
      width={width}
      height={height}
      style={{
        display: 'block',
        height,
        width,
        flexShrink: 0,
        mixBlendMode: 'screen',
      }}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        {image}
      </Link>
    );
  }

  return image;
}
