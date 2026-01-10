import cn from 'clsx'

import { Link } from 'components/link'
import dynamic from 'next/dynamic'

const Instagram = dynamic(() => import('icons/instagram.svg'), { ssr: false })
const Gmail = dynamic(() => import('icons/gmail.svg'), { ssr: false })
const Home = dynamic(() => import('icons/home.svg'), { ssr: false })
import s from './footer.module.scss'


export const Footer = () => {
  return (
    <footer className={cn('theme-light', s.footer)}>
      <div className={cn(s.top, 'layout-grid hide-on-mobile')}>
        <p className={cn(s['first-line'], 'h1')}>
          Computational <br />
          Intelligence <br />
          Society
        </p>


      </div>
      <div className={cn(s.top, 'layout-block hide-on-desktop')}>
        <p className={cn(s['first-line'], 'h1')}>
          Computational <br />
          Intelligence <br />
          Society
        </p>
      </div>
      <div className={s.bottom}>
        <div className={s.links}>
          <Link
            className={cn(s.link, 'p-xs')}
            href="/"
          >
            <Home className={cn(s.icon, s.homeIcon)} />
          </Link>
          <Link
            className={cn(s.link, 'p-xs')}
            href="https://www.instagram.com/ieee_cis_aseb"
          >
            <Instagram className={s.icon} />
          </Link>
          <Link
            className={cn(s.link, 'p-xs')}
            href="mailto:ieeecisaseb@gmail.com"
          >
            <Gmail className={s.icon} />
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
