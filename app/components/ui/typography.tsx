import type { JSX, ReactNode } from "react";

export function TypographyH1({ children }: { children: ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      {children}
    </h1>
  );
}

export function TypographyH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  );
}

export function TypographySmall({
  children,
  ...rest
}: {
  children: ReactNode;
} & JSX.IntrinsicElements["small"]) {
  return (
    <small className="text-sm font-medium leading-none" {...rest}>
      {children}
    </small>
  );
}
