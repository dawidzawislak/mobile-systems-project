import type { FC, ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
};

const Section: FC<SectionProps> = ({ children, className = "" }) => {
  return <div className={"p-3 " + className}>{children}</div>;
};

export default Section;
