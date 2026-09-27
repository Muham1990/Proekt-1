import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);

export function initGsapAnimations() {
  document.documentElement.classList.add('gsap-on');
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-reveal], .dish-card, .chef-card, .welcome__title', { clearProps: 'all', opacity: 1 });
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const welcome = document.querySelector('.welcome__title');
    if (welcome) {
      try {
        const split = SplitText.create
          ? SplitText.create(welcome, { type: 'words' })
          : new SplitText(welcome, { type: 'words' });
        gsap.from(split.words, {
          y: 28,
          opacity: 0,
          duration: 0.55,
          stagger: 0.04,
          ease: 'power3.out'
        });
      } catch {
        gsap.from(welcome, { y: 24, opacity: 0, duration: 0.55, ease: 'power3.out' });
      }
    }

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.table-stage__intro .eyebrow', { y: 16, opacity: 0, duration: 0.45 })
      .from('.table-stage__intro h2', { y: 22, opacity: 0, duration: 0.5 }, '<0.08')
      .from('.table-stage__hint', { y: 12, opacity: 0, duration: 0.4 }, '<0.12');

    gsap.from('.hero__content > *', {
      y: 28,
      opacity: 0,
      stagger: 0.08,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#story', start: 'top 78%' }
    });

    gsap.to('.scroll-hint span', {
      scaleY: 1.15,
      yoyo: true,
      repeat: -1,
      duration: 1,
      ease: 'sine.inOut',
      transformOrigin: 'top'
    });

    ScrollTrigger.batch('.dish-card, .chef-card, .review-card, .news-card, .promo-card, .why-card, .gallery-item', {
      start: 'top 88%',
      onEnter: (els) => gsap.fromTo(els, {
        y: 36, opacity: 0, rotateX: 8
      }, {
        y: 0, opacity: 1, rotateX: 0, stagger: 0.07, duration: 0.55, ease: 'power2.out', overwrite: 'auto'
      })
    });

    gsap.utils.toArray('.section-title').forEach((el) => {
      const split = SplitText.create(el, { type: 'words' });
      gsap.from(split.words, {
        y: 20,
        opacity: 0,
        stagger: 0.04,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    gsap.from('.about-media', {
      x: -36,
      opacity: 0,
      duration: 0.7,
      scrollTrigger: { trigger: '#about', start: 'top 75%' }
    });

    gsap.from('.reserve-form', {
      y: 24,
      opacity: 0,
      duration: 0.65,
      scrollTrigger: { trigger: '#reserve', start: 'top 80%' }
    });

    document.querySelectorAll('.btn--gold').forEach((btn) => {
      btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.04, duration: 0.22, ease: 'power2.out' }));
      btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.22, ease: 'power2.out' }));
    });

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn && typeof window.addToCart === 'function') {
      const pulse = () => gsap.fromTo(cartBtn, { scale: 1 }, { scale: 1.16, yoyo: true, repeat: 1, duration: 0.14 });
      const orig = window.addToCart;
      window.addToCart = function patchedAdd(id) {
        const result = orig(id);
        pulse();
        return result;
      };
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        gsap.to(window, { duration: 0.7, scrollTo: { y: target, offsetY: 0 }, ease: 'power2.inOut' });
      });
    });
  });
}
