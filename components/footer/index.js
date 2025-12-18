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
          Computational <br />
          Intelligence <br />
          Society <span style={{ color: '#b50246' }}>ASEB</span>
        </p>


      </div>
      <div className={cn(s.top, 'layout-block hide-on-desktop')}>
        <p className={cn(s['first-line'], 'h1')}>
          Computational <br />
          Intelligence <br />
          Society <span style={{ color: '#b50246' }}>    ASEB</span>
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

        </div>
        <div className={cn('p-xs', s.tm)}>
          <img
            src="/amrita_logo.png"
            alt="Amrita Vishwa Vidyapeetham"
            style={{ height: '50px', width: 'auto' }}
          />
        </div>

      </div>
    </footer>
  )
}
