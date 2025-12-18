import { useRect } from '@darkroom.engineering/hamo'
import cn from 'clsx'

import { Card } from 'components/card'
import { useScroll } from 'hooks/use-scroll'
import { clamp, mapRange } from 'lib/maths'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { useWindowSize } from 'react-use'

const AppearTitle = dynamic(
  () => import('components/appear-title').then((mod) => mod.AppearTitle),
  { ssr: false }
)

import s from './feature-cards.module.scss'

const cards = [
  {
    name: 'Dr. Nidhin Prabhakar T. V.',
    role: 'Mentor',
    image: '/Dr. Nidhin Prabhakar T. V._Mentor.jpg',
  },
  {
    name: 'Amara Pranav',
    role: 'Chair',
    image: '/Amara Pranav_Chair.jpeg',
  },
  {
    name: 'Keerthinidhi S',
    role: 'Vice Chair',
    image: '/Keerthinidhi S_Vice Chair.jpeg',
  },
  {
    name: 'Bonam Sai Vamsidhar',
    role: 'Treasurer',
    image: '/Bonam Sai Vamsidhar_Treasurer.jpeg',
  },
  {
    name: 'Navnita Krishnan',
    role: 'Co-Treasurer',
    image: '/Navnita Krishnan_Co-Treasurer.jpeg',
  },
  {
    name: 'Chirayu Chaudhari',
    role: 'Secretary',
    image: '/Chirayu Chaudhari_Secretary.jpeg',
  },
  {
    name: 'V Sidharrth',
    role: 'Vice-Secretary',
    image: '/V Sidharrth_Vice-Secretary.jpeg',
  },
  {
    name: 'Ekansh Khullar',
    role: 'Webmaster',
    image: '/Ekansh Khullar_Webmaster.jpeg',
  },
  {
    name: 'Akshita Dindukurthi',
    role: 'Co-Webmaster',
    image: '/Akshita Dindukurthi_Co-Webmaster.jpeg',
  },
  {
    name: 'Dheepak K',
    role: 'Networking Chair',
    image: '/Dheepak K_Networking Chair.jpeg',
  },
  {
    name: 'Janya Billa',
    role: 'Co-Networking Chair',
    image: '/Janya Billa_Co-Networking Chair.jpeg',
  },
  {
    name: 'Dharaneswara Reddy',
    role: 'Publicity Chair',
    image: '/Dharaneswara Reddy_Publicity Chair.jpeg',
  },
  {
    name: 'Kummetha Chandrika',
    role: 'Co-Publicity Chair',
    image: '/Kummetha Chandrika_Co-Publicity Chair.jpeg',
  },
  {
    name: 'Vasudha Barshilia',
    role: 'Membership Chair',
    image: '/Vasudha Barshilia_Membership Chair.jpeg',
  },
  {
    name: 'M Shrivardhan',
    role: 'Co-Membership Chair',
    image: '/M Shrivardhan_Co-Membership Chair.jpeg',
  },
]

export const FeatureCards = () => {
  const element = useRef()
  const [setRef, rect] = useRect()
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const [current, setCurrent] = useState()

  useScroll(
    ({ scroll }) => {
      const start = rect.top - windowHeight * 2
      const end = rect.top + rect.height - windowHeight

      const progress = clamp(0, mapRange(start, end, scroll, 0, 1), 1)

      element.current.style.setProperty(
        '--progress',
        clamp(0, mapRange(rect.top, end, scroll, 0, 1), 1)
      )
      const step = Math.floor(progress * cards.length)
      setCurrent(step)
    },
    [rect]
  )

  return (
    <div
      ref={(node) => {
        setRef(node)
      }}
      className={s.features}
    >
      <div className={cn('layout-block-inner', s.sticky)}>
        <aside className={s.title}>
          <p className="h3">
            <AppearTitle>
              CIS Club
              <br />
              <span className="grey">Team Members</span>
            </AppearTitle>
          </p>
        </aside>
        <div ref={element}>
          {cards.map((card, index) => (
            <SingleCard
              key={index}
              index={index}
              name={card.name}
              role={card.role}
              image={card.image}
              current={index <= current - 1}
              windowWidth={windowWidth}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const SingleCard = ({ name, role, image, index, current, windowWidth }) => {
  const isDesktop = windowWidth > 800
  const count = 15
  const divisor = count - 1

  const desktopStyle = {
    top: `calc(((100vh - 30.55vw - (2 * var(--layout-margin))) / ${divisor}) * ${index})`,
    left: `calc(((100vw - 30.55vw - (2 * var(--layout-margin))) / ${divisor}) * ${index})`,
  }

  const mobileStyle = {
    top: `calc((((100 * var(--vh, 1vh)) - 117.33vw - (var(--layout-margin))) / ${divisor}) * ${index})`,
  }

  const style = {
    '--i': index,
    ...(isDesktop ? desktopStyle : mobileStyle),
  }

  return (
    <div className={cn(s.card, current && s.current)} style={style}>
      <Card
        background="rgba(239, 239, 239, 0.8)"
        text={
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5em',
              textTransform: 'none',
              height: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <img
              src={image}
              alt={name}
              style={{
                width: '100%',
                aspectRatio: '4/3',
                objectFit: 'cover',
                borderRadius: '4px',
                display: 'block',
              }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2em' }}>
              <span style={{ fontWeight: 'bold', lineHeight: '1.1', fontSize: '1.1em' }}>
                {name}
              </span>
              <span style={{ fontSize: '0.7em', opacity: 0.7, lineHeight: '1.2' }}>{role}</span>
            </span>
          </span>
        }
      />
    </div>
  )
}
