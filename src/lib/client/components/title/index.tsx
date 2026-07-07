import Image from 'next/image';
import React from 'react';

const SIDEBAR_LOGO = '/images/login/logo-sidebar.png';

export interface LogoProps {
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = (props: LogoProps) => {
  const { collapsed = false } = props;

  return (
    <div className="flex h-full w-full items-center justify-center px-2">
      {collapsed ? (
        <div className="flex size-11 items-center justify-center rounded-md bg-[#26002e] text-xl font-light tracking-[0.08em] text-white">
          V
        </div>
      ) : (
        <Image
          src={SIDEBAR_LOGO}
          alt="Voltaris"
          width={280}
          height={78}
          className="h-auto w-full max-w-[280px] object-contain"
          priority
        />
      )}
    </div>
  );
};
