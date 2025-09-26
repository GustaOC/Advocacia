// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/components/ui/skeleton.tsx

import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }