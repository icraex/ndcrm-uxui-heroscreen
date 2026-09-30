import { useEffect, useRef, useState } from 'react';
import { MeshDriftBackground } from './MeshDriftBackground';
import logo from './assets/logo.svg';
import productScreen from './assets/product-screen.jpg';
import module1 from './assets/module-1.svg';
import module2 from './assets/module-2.svg';
import module3 from './assets/module-3.svg';
import module4 from './assets/module-4.svg';
import module5 from './assets/module-5.svg';
import module6 from './assets/module-6.svg';
import module7 from './assets/module-7.svg';
import module8 from './assets/module-8.svg';
import module9 from './assets/module-9.svg';
import agentIcon from './assets/agent-icon.svg';
import rulesIcon from './assets/rules-icon.svg';

const navItems = ['Кейсы', 'Как работает', 'Безопасность', 'Тарифы', 'AI-агенты', 'WhatsApp'];

const moduleIcons = [module1, module2, module3, module4, module5, module6, module7, module8, module9];

function useScrollLinkedScene() {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollProgress = 0;
    let frame = 0;

    const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
    const smoothstep = (start: number, end: number, value: number) => {
      const t = clamp((value - start) / (end - start));
      return t * t * (3 - 2 * t);
    };

    const setPointerTarget = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || reducedMotion.matches) return;
      const rect = stage.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
      targetY = Math.max(-1, Math.min(1, (event.clientY - (rect.top + Math.min(rect.height, 900) / 2)) / (Math.min(rect.height, 900) / 2)));
      requestRender();
    };

    const resetPointer = () => {
      targetX = 0;
      targetY = 0;
      requestRender();
    };

    const setScrollProgress = () => {
      if (reducedMotion.matches) {
        scrollProgress = 0;
        return;
      }
      const story = stage.querySelector<HTMLElement>('.scroll-story');
      if (!story) return;
      const storyTop = story.getBoundingClientRect().top + window.scrollY;
      const scrollDistance = Math.max(1, story.offsetHeight - window.innerHeight);
      scrollProgress = clamp((window.scrollY - storyTop) / scrollDistance);
    };

    const tick = () => {
      frame = 0;
      const damping = 0.075;
      currentX += (targetX - currentX) * damping;
      currentY += (targetY - currentY) * damping;
      stage.style.setProperty('--px', currentX.toFixed(4));
      stage.style.setProperty('--py', currentY.toFixed(4));

      const productTravel = -245 * smoothstep(0.025, 0.68, scrollProgress);
      const heroTravel = -230 * smoothstep(0.05, 0.5, scrollProgress);
      const heroOpacity = 1 - smoothstep(0.34, 0.53, scrollProgress);
      stage.style.setProperty('--scene-progress', scrollProgress.toFixed(5));
      stage.style.setProperty('--background-y', `${(-24 * scrollProgress).toFixed(2)}px`);
      stage.style.setProperty('--product-y', `${productTravel.toFixed(2)}px`);
      stage.style.setProperty('--hero-y', `${heroTravel.toFixed(2)}px`);
      stage.style.setProperty('--hero-opacity', heroOpacity.toFixed(4));

      const ctaReveal = smoothstep(0.91, 0.96, scrollProgress);
      stage.style.setProperty('--cta-opacity', ctaReveal.toFixed(4));
      stage.style.setProperty('--cta-y', `${(42 * (1 - ctaReveal)).toFixed(2)}px`);
      stage.style.setProperty('--cta-scale', (0.96 + 0.04 * ctaReveal).toFixed(4));
      stage.style.setProperty('--cta-blur', `${(14 * (1 - ctaReveal)).toFixed(2)}px`);

      const cards = [
        { start: 0.08, duration: 0.34 },
        { start: 0.24, duration: 0.34 },
        { start: 0.4, duration: 0.34 },
        { start: 0.56, duration: 0.34 },
      ];

      cards.forEach(({ start, duration }, index) => {
        const travel = clamp((scrollProgress - start) / duration);
        const reveal = smoothstep(start, start + 0.055, scrollProgress);
        const exit = 1 - smoothstep(start + duration - 0.085, start + duration, scrollProgress);
        const opacity = Math.min(reveal, exit);
        const y = 150 + (-930 * travel);
        const scale = 0.96 + 0.04 * reveal - 0.018 * (1 - exit);
        const blur = 17 * (1 - reveal) + 12 * (1 - exit);
        stage.style.setProperty(`--card-${index + 1}-y`, `${y.toFixed(2)}px`);
        stage.style.setProperty(`--card-${index + 1}-opacity`, opacity.toFixed(4));
        stage.style.setProperty(`--card-${index + 1}-scale`, scale.toFixed(4));
        stage.style.setProperty(`--card-${index + 1}-blur`, `${blur.toFixed(2)}px`);
      });
      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        frame = requestAnimationFrame(tick);
      }
    };

    function requestRender() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    const onScrollOrResize = () => {
      setScrollProgress();
      requestRender();
    };

    stage.addEventListener('pointermove', setPointerTarget, { passive: true });
    stage.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    setScrollProgress();
    requestRender();

    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener('pointermove', setPointerTarget);
      stage.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('blur', resetPointer);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  return stageRef;
}

function FeatureCards() {
  return (
    <div className="feature-floaters" aria-label="Возможности платформы">
      <article className="feature-card feature-modules">
        <div className="module-ribbon" aria-hidden="true">
          {moduleIcons.map((src, index) => <span key={src} className={index === 4 ? 'featured' : ''}><img src={src} alt="" /></span>)}
        </div>
        <div className="feature-copy columns-copy">
          <h2><strong>24 модуля</strong> для цифровизации бизнеса</h2>
          <p>Объедините продажи, обслуживание, задачи, проекты и аналитику в одной системе.</p>
        </div>
      </article>

      <article className="feature-card feature-rules">
        <div className="agent-heading">
          <span className="agent-badge"><img src={rulesIcon} alt="" /></span>
          <h2>Система под ваши правила работы</h2>
        </div>
        <p>Настраивайте воронки, поля, роли и автоматизацию под процессы своей компании.</p>
      </article>

      <article className="feature-card feature-agent">
        <div className="agent-heading">
          <span className="agent-badge"><img src={agentIcon} alt="" /></span>
          <h2>Бизнес на связи 24/7</h2>
        </div>
        <p>AI консультирует клиентов, оформляет заявки и продает даже в не рабочее время</p>
      </article>

      <article className="feature-card feature-journey">
        <h2>Весь путь клиента <strong>под контролем</strong></h2>
        <p>От первого обращения до оплаты, исполнения и повторной продажи. Весь рабочий цикл в одном контуре</p>
      </article>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="dashboard-shell">
      <img
        className="product-screen"
        src={productScreen}
        width="1600"
        height="891"
        alt="Интерфейс ND-CRM с воронкой продаж"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState(0);
  const parallaxRef = useScrollLinkedScene();

  return (
    <main className="page" ref={parallaxRef}>
      <header className="glass-nav">
        <a className="logo" href="#top" aria-label="MV Capital"><img src={logo} alt="MV Capital CRM" /></a>
        <nav aria-label="Основная навигация">
          {navItems.map((item, index) => (
            <button key={item} className={active === index ? 'active' : ''} onClick={() => setActive(index)}><span>{item}</span></button>
          ))}
        </nav>
        <button className="try-button" onClick={() => document.querySelector('.dashboard-shell')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><span>Попробовать</span></button>
      </header>

      <section className="scroll-story" id="top">
        <div className="sticky-scene">
          <div className="background-layer" aria-hidden="true">
            <MeshDriftBackground />
          </div>

          <section className="hero">
            <h1>AI-платформа для продаж, сервиса<br className="desktop-break" /> и управления компанией</h1>
            <p className="lead">Объедините обращения, продажи и работу команды в одной системе. AI возьмёт на себя первичные диалоги и закрытие клиентов, сотрудники получат задачи и контекст, а вы — картину работы бизнеса. Поможем настроить всё под ваши процессы.</p>
            <div className="hero-cta-group">
              <button className="hero-cta" type="button" onClick={() => document.querySelector('.dashboard-shell')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                <span>Попробовать</span>
                <span className="hero-cta-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="m16.172 11-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor" />
                  </svg>
                </span>
              </button>
              <p className="hero-cta-note"><span>7 дней</span><span>бесплатно</span></p>
            </div>
          </section>

          <div className="product-layer"><ProductPreview /></div>
          <FeatureCards />
          <button className="scroll-cta" type="button">Попробовать 7 дней бесплатно</button>
          <div className="bottom-fade" />
        </div>
      </section>
      <div className="after-story" aria-hidden="true" />
    </main>
  );
}
