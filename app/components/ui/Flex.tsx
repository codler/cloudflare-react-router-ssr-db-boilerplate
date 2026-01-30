import type { ComponentProps, FC } from "react";

import { cn } from "@/utils/shadcn";

import Box from "./Box";

type Props = {
  className?: string;
  children?: React.ReactNode;
} & ComponentProps<typeof Box>;

const Flex: FC<Props> = ({ className, children, ...rest }) => {
  return (
    <Box {...rest} className={cn("flex-row flex-wrap items-center", className)}>
      {children}
    </Box>
  );
};

export default Flex;
