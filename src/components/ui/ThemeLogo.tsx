"use client";

import Image from 'next/image';

interface ThemeLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function ThemeLogo({ width = 40, height = 40, className = '' }: ThemeLogoProps) {
  return (
    <div className="overflow-hidden shrink-0" style={{ width, height, borderRadius: '8px' }}>
      <Image
        src="/logo_claro.png"
        alt="Body Shop"
        width={width}
        height={height}
        className={`dark:hidden object-cover w-full h-full ${className}`}
        priority
      />
      <Image
        src="/logo_oscuro.png"
        alt="Body Shop"
        width={width}
        height={height}
        className={`hidden dark:block object-cover w-full h-full ${className}`}
        priority
      />
    </div>
  );
}
