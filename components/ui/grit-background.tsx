import { clsx } from 'clsx'

export function GritBackground({ className }: { className?: string }) {
  return (
    <div
      className={clsx([
        'absolute z-[-1]',
        'bg-cover bg-center',
        '[background-image:url("https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/06/0679cc658492620b90f448fd97a9524e03ae1ae652ad9eb5d0937c564e8ff8bd.webp")]',
        'dark:[background-image:url("https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/22/22a9f305e2d0b1d2fb159388122ce8f8d0ac766fd39c470c1c443f50b13b072a.webp")]',
        className,
      ])}
    />
  )
}
