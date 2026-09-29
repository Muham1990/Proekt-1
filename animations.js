import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function initGsapAnimations() {
  document.documentElement.classList.add('gsap-on');
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-reveal], .dish-card, .chef-card, .welcome__title', { clearProps: 'all', opacity: 1 });
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.home-hero .eyebrow', { y: 16, opacity: 0, duration: 0.5 })
      .from('.home-hero h1', { y: 22, opacity: 0, duration: 0.55 }, '<0.08')
      .from('.home-hero__lead', { y: 16, opacity: 0, duration: 0.45 }, '<0.1')
      .from('.home-hero__actions', { y: 14, opacity: 0, duration: 0.45 }, '<0.08')
      .from('.home-hero__next', { y: 10, opacity: 0, duration: 0.4 }, '<0.12');

    gsap.fromTo('.home-hero__photo', { scale: 1.03 }, {
      scale: 1, duration: 1.4, ease: 'power2.out'
    });

    gsap.from('.table-hero .eyebrow, .table-hero h2, .table-hero__divider, .table-hero .dish-indicator, .table-hero__lead', {
      y: 18, opacity: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out',
      scrollTrigger: { trigger: '#dastarkhan', start: 'top 78%' }
    });
    gsap.from('.dish-medallion', {
      scale: 0.98, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '#dastarkhan', start: 'top 78%' }
    });
    gsap.from('.dish-nav', {
      scale: 0.88, duration: 0.45, stagger: 0.08, ease: 'power2.out',
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
