import type { FC, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
}

const Textarea: FC<TextareaProps> = ({
  fullWidth = true,
  className = "",
  ...props
}) => {
  const baseStyles =
    "px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 resize-none relative z-10";

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <textarea
      className={`${baseStyles} ${widthStyle} ${className}`}
      {...props}
    />
  );
};

export default Textarea;
