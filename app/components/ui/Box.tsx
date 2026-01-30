import type { ComponentProps, FC } from "react";

import { cn } from "@/utils/shadcn";

type Props = {
  className?: string;
  children?: React.ReactNode;
} & ComponentProps<"div">;

const Box: FC<Props> = ({ className, children, ...rest }) => {
  return (
    <div {...rest} className={cn("flex flex-col items-start gap-2", className)}>
      {children}
    </div>
  );
};

export default Box;
