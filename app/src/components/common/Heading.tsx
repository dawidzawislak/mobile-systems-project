import type { FC, ReactNode } from 'react'

interface HeadingProps {
  level: 1 | 2 | 3
  children: ReactNode
  className?: string
}

const Heading: FC<HeadingProps> = ({ level, children, className = '' }) => {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3'

  const styles = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-semibold',
    3: 'text-lg font-medium',
  }

  return <Tag className={`${styles[level]} ${className}`}>{children}</Tag>
}

export default Heading
