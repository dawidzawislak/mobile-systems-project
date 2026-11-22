import { type ReactNode } from "react";
import { Button, Heading } from ".";

export default function Content({
  header = undefined,
  children,
  buttonNext,
  buttonBack,
  buttonNextAction,
  buttonBackAction,
  buttonNextDisabled,
  className = "",
}: {
  header?: string;
  children: ReactNode;
  buttonNext?: string;
  buttonBack?: string;
  buttonNextAction?: () => void;
  buttonBackAction?: () => void;
  buttonNextDisabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`h-full w-full flex flex-col bg-white ${className}`}>
      {header && (
        <div className="px-4 pt-4">
          <Heading level={1}>{header}</Heading>
          <hr className="my-4" />
        </div>
      )}
      <div className="flex-grow overflow-y-auto px-4">{children}</div>
      {(buttonBack || buttonNext) && (
        <div className="p-4 flex gap-4">
          {buttonBack && (
            <Button fullWidth onClick={buttonBackAction} variant="secondary">
              {buttonBack}
            </Button>
          )}
          {buttonNext && (
            <Button
              fullWidth
              onClick={buttonNextAction}
              disabled={buttonNextDisabled}
            >
              {buttonNext}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
