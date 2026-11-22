import type { FC, SVGProps } from 'react'

interface CloseIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

const CloseIcon: FC<CloseIconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

export default CloseIcon
