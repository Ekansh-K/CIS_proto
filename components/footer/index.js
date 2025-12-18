import cn from 'clsx'
import { Button } from 'components/button'
import { Link } from 'components/link'
import dynamic from 'next/dynamic'
import s from './footer.module.scss'

const GitHub = dynamic(() => import('icons/github.svg'), { ssr: false })

export const Footer = () => {
  return (
    <footer className={cn('theme-light', s.footer)}>
      <div className={cn(s.top, 'layout-grid hide-on-mobile')}>
        <p className={cn(s['first-line'], 'h1')}>
          Lenis is <br />
          <span className="contrast">Open source</span>
        </p>
        {/* <div className={s['shameless-plug']}>
          <p className="h4">Studio Freight</p>
          <p className="p-s">
            An independent creative <br /> studio built on principle
          </p>
        </div> */}

        <Button
          className={s.cta}
          arrow
          icon={<GitHub />}
          href="https://github.com/sponsors/darkroomengineering"
        >
          Let's build together
        </Button>
      </div>
      <div className={cn(s.top, 'layout-block hide-on-desktop')}>
        {/* <div className={s['shameless-plug']}>
          <p className="h4">Studio Freight</p>
          <p className="p-s">
            An independent creative <br /> studio built on principle
          </p>
        </div> */}
        <p className={cn(s['first-line'], 'h1')}>
          Lenis is <br />
          <span className="contrast">Open source</span>

        </p>
      </div>
      <div className={s.bottom}>
        <div className={s.links}>
          <Link
            className={cn(s.link, 'p-xs')}
            href=""
          >
            LinkedIn
          </Link>
          <Link
            className={cn(s.link, 'p-xs')}
            href=""
          >
            Instagram
          </Link>
          <Link
            className={cn(s.link, 'p-xs')}
            href="https://darkroom.engineering/"
          >
            Website
          </Link>
          <Link className={cn(s.link, 'p-xs')} href="https://studiofreight.com">
            Designed by Studio Frei
          </Link>
        </div>
        <p className={cn('p-xs', s.tm)}>
          <span>©</span> {new Date().getFullYear()} darkroom.engineering
        </p>
        <Button
          className={cn(s.cta, 'hide-on-desktop')}
          arrow
          icon={<GitHub />}
          href="https://github.com/sponsors/darkroomengineering"
        >
          Let's build together
        </Button>
      </div>
    </footer>
  )
}
