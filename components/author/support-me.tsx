import { AUTHOR_INFO } from '~/data/author-info'
import { Image } from '~/components/ui/image'
import clsx from 'clsx'

export function SupportMe({ className }: { className?: string }) {
  return (
    <div className={clsx(className)}>
      <a href={AUTHOR_INFO.support.kofi} target="_blank" className="[&_.image-container]:mx-0">
        <Image
          src="https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/2f/2ff7a120aa4d57fe67019d833916e3c6ad623d4626dbb5ac5d5ab0d48972d349.webp"
          alt="Support me on Ko-fi"
          width={297}
          height={60}
          style={{ height: 60, width: 'auto' }}
        />
      </a>
    </div>
  )
}
