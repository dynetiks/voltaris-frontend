import React from 'react';

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
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-semibold lowercase tracking-[-0.03em] text-[#26002e]">
            voltaris
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            CSMS
          </span>
        </div>
      )}
    </div>
  );
};
