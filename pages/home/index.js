import { useFrame, useRect } from '@darkroom.engineering/hamo'
import cn from 'clsx'

import { Button } from 'components/button'
import { Card } from 'components/card'
import { Title } from 'components/intro'

import { ListItem } from 'components/list-item'
import { projects } from 'content/projects'
import { useScroll } from 'hooks/use-scroll'
import { Layout } from 'layouts/default'
import { button, useControls } from 'leva'
import { clamp, mapRange } from 'lib/maths'
import { useStore } from 'lib/store'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useIntersection, useWindowSize } from 'react-use'
import s from './home.module.scss'


const Phone = dynamic(() => import('icons/phone.svg'), { ssr: false })
const Calendar = dynamic(() => import('icons/calendar.svg'), { ssr: false })


const Parallax = dynamic(
  () => import('components/parallax').then((mod) => mod.Parallax),
  { ssr: false }
)

const AppearTitle = dynamic(
  () => import('components/appear-title').then((mod) => mod.AppearTitle),
  { ssr: false }
)

const HorizontalSlides = dynamic(
  () =>
    import('components/horizontal-slides').then((mod) => mod.HorizontalSlides),
  { ssr: false }
)

const FeatureCards = dynamic(
  () => import('components/feature-cards').then((mod) => mod.FeatureCards),
  { ssr: false }
)

const WebGL = dynamic(
  () => import('components/webgl').then(({ WebGL }) => WebGL),
  { ssr: false }
)

const HeroTextIn = ({ children, introOut }) => {
  return (
    <div className={cn(s['hide-text'], introOut && s['show-text'])}>
      {children}
    </div>
  )
}

if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
}

export default function Home() {
  const router = useRouter()
  const [hasScrolled, setHasScrolled] = useState()
  const zoomRef = useRef(null)
  const [zoomWrapperRectRef, zoomWrapperRect] = useRect()
  const { height: windowHeight } = useWindowSize()
  const introOut = useStore(({ introOut }) => introOut)

  const [theme, setTheme] = useState('dark')
  const lenis = useStore(({ lenis }) => lenis)

  useControls(
    'lenis',
    () => ({
      stop: button(() => {
        lenis.stop()
      }),
      start: button(() => {
        lenis.start()
      }),
    }),
    [lenis]
  )

  useControls(
    'scrollTo',
    () => ({
      immediate: button(() => {
        lenis.scrollTo(30000, { immediate: true })
      }),
      smoothDuration: button(() => {
        lenis.scrollTo(30000, { lock: true, duration: 10 })
      }),
      smooth: button(() => {
        lenis.scrollTo(30000)
      }),
      forceScrollTo: button(() => {
        lenis.scrollTo(30000, { force: true })
      }),
    }),
    [lenis]
  )

  useEffect(() => {
    if (!lenis) return

    function onClassNameChange(lenis) {
      console.log(lenis.className)
    }

    lenis.on('className change', onClassNameChange)

    return () => {
      lenis.off('className change', onClassNameChange)
    }
  }, [lenis])

  useScroll(({ scroll }) => {
    setHasScrolled(scroll > 10)
    if (!zoomWrapperRect.top) return

    const start = zoomWrapperRect.top + windowHeight * 0.5
    const end = zoomWrapperRect.top + zoomWrapperRect.height - windowHeight

    const progress = clamp(0, mapRange(start, end, scroll, 0, 1), 1)
    const center = 0.6
    const progress1 = clamp(0, mapRange(0, center, progress, 0, 1), 1)
    const progress2 = clamp(0, mapRange(center - 0.055, 1, progress, 0, 1), 1)
    setTheme(progress2 === 1 ? 'light' : 'dark')

    zoomRef.current.style.setProperty('--progress1', progress1)
    zoomRef.current.style.setProperty('--progress2', progress2)

    if (progress === 1) {
      zoomRef.current.style.setProperty('background-color', 'currentColor')
    } else {
      zoomRef.current.style.removeProperty('background-color')
    }
  })

  const [whyRectRef, whyRect] = useRect()
  const [cardsRectRef, cardsRect] = useRect()
  const [whiteRectRef, whiteRect] = useRect()
  const [featuresRectRef, featuresRect] = useRect()
  const [inuseRectRef, inuseRect] = useRect()

  const addThreshold = useStore(({ addThreshold }) => addThreshold)

  useEffect(() => {
    addThreshold({ id: 'top', value: 0 })
  }, [])

  useEffect(() => {
    const top = whyRect.top - windowHeight / 2
    addThreshold({ id: 'why-start', value: top })
    addThreshold({
      id: 'why-end',
      value: top + whyRect.height,
    })
  }, [whyRect])

  useEffect(() => {
    const top = cardsRect.top - windowHeight / 2
    addThreshold({ id: 'cards-start', value: top })
    addThreshold({ id: 'cards-end', value: top + cardsRect.height })
    addThreshold({
      id: 'red-end',
      value: top + cardsRect.height + windowHeight,
    })
  }, [cardsRect])

  useEffect(() => {
    const top = whiteRect.top - windowHeight
    addThreshold({ id: 'light-start', value: top })
  }, [whiteRect])

  useEffect(() => {
    const top = featuresRect.top
    addThreshold({ id: 'features', value: top })
  }, [featuresRect])

  useEffect(() => {
    const top = inuseRect.top
    addThreshold({ id: 'in-use', value: top })
  }, [inuseRect])

  useEffect(() => {
    const top = lenis?.limit
    addThreshold({ id: 'end', value: top })
  }, [lenis?.limit])

  useScroll((e) => {
    console.log(window.scrollY, e.scroll, e.isScrolling, e.velocity, e.isLocked)
  })

  useFrame(() => {
    console.log('frame', window.scrollY, lenis?.scroll, lenis?.isScrolling)
  }, 1)

  const inUseRef = useRef()

  const [visible, setIsVisible] = useState(false)
  const intersection = useIntersection(inUseRef, {
    threshold: 0.2,
  })
  useEffect(() => {
    if (intersection?.isIntersecting) {
      setIsVisible(true)
    }
  }, [intersection])

  return (
    <Layout
      theme={theme}
      seo={{
        title: 'CIS-ASEB',
        description:
          'ieee cis website',
      }}
      className={s.home}
    >
      <div className={s.canvas}>
        <WebGL />
      </div>



      <section className={s.hero}>
        <div className="layout-grid-inner">
          <Title className={s.title} />
          {/* <SFDR className={cn(s.icon, introOut && s.show)} /> */}
          <span className={cn(s.sub)}>

          </span>
        </div>

        <div className={cn(s.bottom, 'layout-grid')}>
          <div
            className={cn(
              'hide-on-mobile',
              s['scroll-hint'],
              hasScrolled && s.hide,
              introOut && s.show
            )}
          >
            <div className={s.text}>
              <HeroTextIn introOut={introOut}>
                <p>scroll</p>
              </HeroTextIn>
              <HeroTextIn introOut={introOut}>
                <p> to explore</p>
              </HeroTextIn>
            </div>
          </div>

          <Button
            className={cn(s.cta, s.documentation, introOut && s.in)}
            arrow
            icon={<Calendar />}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = rect.left + rect.width / 2
              const y = rect.top + rect.height / 2

              useStore.getState().setTransition({
                isActive: true,
                state: 'expanding',
                origin: { x, y },
              })

              setTimeout(() => {
                router.push('/events')
              }, 800)
            }}
          >
            Events
          </Button>
          <Button
            className={cn(s.cta, s.sponsor, introOut && s.in)}
            arrow
            icon={<Phone />}
            href="mailto:ieeecisaseb@gmail.com"
          >
            contact us
          </Button>
        </div>
      </section>

      <section className={s.why} data-lenis-scroll-snap-align="start">
        <div className="layout-grid">
          <h2 className={cn(s.sticky, 'h2')}>
            <AppearTitle>About CIS</AppearTitle>
          </h2>
          <aside className={s.features} ref={whyRectRef}>
            <div className={s.feature}>
              <p className="p">
                Computational Intelligence Society (CIS) is an IEEE technical
                society dedicated to advancing artificial intelligence through
                computational paradigms. They focus on neural networks,
                machine learning algorithms, and generative AI driving intelligent
                systems and autonomous applications in data science.
              </p>
            </div>
            <div className={s.feature}>
              <h3 className={cn(s.title, 'h4')}>
                Machine Learning & Deep Learning
              </h3>
              <p className="p">
                CIS aims to focus onneural networks, deep learning
                architectures, and supervised/unsupervised learning
                algorithms that power modern AI applications across various domains.
              </p>
            </div>
            <div className={s.feature}>
              <h3 className={cn(s.title, 'h4')}>
                Generative AI & LLMs
              </h3>
              <p className="p">
                CIS explores generative models, large language models,
                diffusion models, and transformer architectures that enable
                AI systems to create content and understand natural language.
              </p>
            </div>
            <div className={s.feature}>
              <h3 className={cn(s.title, 'h4')}>
                Global Community:
              </h3>
              <p className="p">
                Over 6,000 members comprising of researchers, practitioners,
                students, educators, and industry professionals worldwide,
                united by interests to foster collaboration through conferences,
                publications, and educational activities.
              </p>
            </div>
          </aside>
        </div>
      </section>
      <section className={s.rethink}>
        <div className={cn('layout-grid', s.pre)}>
          <div className={s.highlight} data-lenis-scroll-snap-align="start">
            <Parallax speed={-0.5}>
              <p className="h2">
                <AppearTitle>Why u Should Join CIS</AppearTitle>
              </p>
            </Parallax>
          </div>
          <div className={s.comparison}>
            <Parallax speed={0.5}>
              <p className="p">
                CIS offers structured learning and experiences in high-demand AI fields like
                machine learning, data science, and generative AI,
                hands-on projects, and industry exposure unlike inactive clubs lacking
                engagement and technical depth
              </p>
            </Parallax>
          </div>
        </div>
        <div className={s.cards} ref={cardsRectRef}>
          <HorizontalSlides>
            <Card
              className={s.card}
              number="01"
              text="Turn ideas into intelligent solutions"
            />
            <Card
              className={s.card}
              number="02"
              text="Research oriented projects"
            />
            <Card
              className={s.card}
              number="03"
              text="Structured mentoring and skill development"
            />
            <Card
              className={s.card}
              number="04"
              text="Immersive, Interactive, Innovative technical events"
            />
            <Card
              className={s.card}
              number="05"
              text="Be a part of the AI revolution"
            />
          </HorizontalSlides>
        </div>
      </section>
      <section
        ref={(node) => {
          zoomWrapperRectRef(node)
          zoomRef.current = node
        }}
        className={s.solution}
      >
        <div className={s.inner}>
          <div className={s.zoom}>
            <h2 className={cn(s.first, 'h1 vh')}>
              We Present to u<br />
              <span className="contrast">Our Club</span>
            </h2>
            <h2 className={cn(s.enter, 'h3 vh')}>
              CIS <br />
            </h2>
            <h2 className={cn(s.second, 'h1 vh')}>Join,Learn,Grow</h2>
          </div>
        </div>
      </section>
      <section className={cn('theme-light', s.featuring)} ref={whiteRectRef}>
        <div className={s.inner}>
          <div className={cn('layout-block', s.intro)}>
            <p className="p-l">
              Lets Shape the Future together
            </p>
          </div>
        </div>
        <section ref={featuresRectRef}>
          <FeatureCards />
        </section>
      </section>
      <section
        ref={(node) => {
          inuseRectRef(node)
          inUseRef.current = node
        }}
        className={cn('theme-light', s['in-use'], visible && s.visible)}
      >
        <div className="layout-grid">
          <aside className={s.title}>
            <p className="h3">
              <AppearTitle>
                <span>CIS Club</span>

                <br />
                <span className="grey">Projects</span>
              </AppearTitle>
            </p>
          </aside>
          <ul className={s.list}>
            {projects.map(({ title, source, href }, i) => (
              <li key={i}>
                <ListItem
                  title={title}
                  source={source}
                  href={href}
                  index={i}
                  visible={visible}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Layout>
  )
}

export async function getStaticProps() {
  return {
    props: {
      id: 'home',
    }, // will be passed to the page component as props
  }
}
