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
    intro.from('.home-hero .eyebrow', { y: 16, opacity: 0, duration: 0.5 })
      .from('.home-hero h1', { y: 22, opacity: 0, duration: 0.55 }, '<0.08')
      .from('.home-hero__lead', { y: 16, opacity: 0, duration: 0.45 }, '<0.1')
      .from('.home-hero__actions', { y: 14, opacity: 0, duration: 0.45 }, '<0.08')
      .from('.home-hero__next', { y: 10, opacity: 0, duration: 0.4 }, '<0.12');

    gsap.fromTo('.home-hero__photo', { scale: 1.12, y: 18 }, {
      scale: 1.04, y: 0, duration: 1.8, ease: 'power3.out'
    });

    gsap.from('.table-hero .eyebrow, .table-hero h2, .table-hero__lead', {
      y: 18, opacity: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out',
      scrollTrigger: { trigger: '#dastarkhan', start: 'top 78%' }
    });
    gsap.from('.dastarkhan-frame', {
      scale: 0.96, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '#dastarkhan', start: 'top 78%' }
    });
    gsap.from('.dish-nav', {
      autoAlpha: 0, scale: 0.7, duration: 0.5, stagger: 0.08, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '#dastarkhan', start: 'top 70%' }
    });
    gsap.from('.dish-meta', {
      autoAlpha: 0, y: 10, duration: 0.45, ease: 'power2.out',
      scrollTrigger: { trigger: '#dastarkhan', start: 'top 70%' }
    });

    gsap.fromTo('.hero__content > *', {
      y: 24
    }, {
      y: 0,
      opacity: 1,
      stagger: 0.08,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#story', start: 'top 92%', toggleActions: 'play none none none' }
    });

    gsap.to('.scroll-hint span', {
      scaleY: 1.15,
      yoyo: true,
      repeat: -1,
      duration: 1,
      ease: 'sine.inOut',
      transformOrigin: 'top'
    });

    ScrollTrigger.batch('.chef-card, .review-card, .news-card, .promo-card, .why-card, .gallery-item', {
      start: 'top 88%',
      onEnter: (els) => gsap.fromTo(els, {
        y: 36, opacity: 0, rotateX: 8
      }, {
        y: 0, opacity: 1, rotateX: 0, stagger: 0.07, duration: 0.55, ease: 'power2.out', overwrite: 'auto'
      })
    });

    gsap.utils.toArray('.section-title').forEach((el) => {
      gsap.from(el, {
        y: 20,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    gsap.from('.about-media', {
      x: -28,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#about', start: 'top 80%' }
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
  });
}
