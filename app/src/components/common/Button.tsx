import type { FC, ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger" | "secondary";
  fullWidth?: boolean;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const baseStyles =
    "p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-md";

  const variantStyles = {
    primary: "bg-orange-600 text-white hover:bg-orange-700",
    ghost: "text-orange-600 hover:text-orange-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-100",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
