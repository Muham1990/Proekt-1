import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGsapAnimations() {
  document.documentElement.classList.add('gsap-on');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const welcome = document.querySelector('.welcome__title');
  if (welcome) {
    gsap.from(welcome, { y: 40, opacity: 0, filter: 'blur(12px)', duration: 1.4, ease: 'power3.out', delay: 0.2 });
  }

  gsap.from('.hero__content > *', {
    y: 36,
    opacity: 0,
    stagger: 0.12,
    duration: 1,
    ease: 'power3.out',
    delay: 0.15
  });

  gsap.to('.scroll-hint span', {
    scaleY: 1.15,
    yoyo: true,
    repeat: -1,
    duration: 1.2,
    ease: 'sine.inOut',
    transformOrigin: 'top'
  });

  ScrollTrigger.batch('.dish-card, .chef-card, .review-card, .news-card, .promo-card, .why-card, .gallery-item', {
    start: 'top 88%',
    onEnter: (els) => gsap.fromTo(els, {
      y: 48, opacity: 0
    }, {
      y: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: 'power2.out', overwrite: 'auto'
    })
  });

  gsap.utils.toArray('.section-title, .eyebrow').forEach((el) => {
    gsap.from(el, {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  gsap.from('.about-media', {
    x: -40,
    opacity: 0,
    duration: 1,
    scrollTrigger: { trigger: '#about', start: 'top 75%' }
  });

  gsap.from('.reserve-form', {
    y: 30,
    opacity: 0,
    duration: 0.9,
    scrollTrigger: { trigger: '#reserve', start: 'top 80%' }
  });

  document.querySelectorAll('.btn--gold').forEach((btn) => {
    btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.04, duration: 0.25, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.25, ease: 'power2.out' }));
  });

  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) {
    const pulse = () => gsap.fromTo(cartBtn, { scale: 1 }, { scale: 1.18, yoyo: true, repeat: 1, duration: 0.16 });
    const orig = window.addToCart;
    if (typeof orig === 'function') {
      window.addToCart = function patchedAdd(id) {
        const result = orig(id);
        pulse();
        return result;
      };
    }
  }
}
