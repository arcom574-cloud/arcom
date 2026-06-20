'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface CounterCardProps {
  num: number;
  suffix: string;
  label: string;
  icon: ReactNode;
  index: number;
}

export default function CounterCard({ num, suffix, label, icon, index }: CounterCardProps) {
  const [count, setCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let ctx: { revert: () => void } | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.set(card, { opacity: 0, y: 72, scale: 0.88 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true,
          },
        });

        tl.to(card, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          delay: index * 0.14,
        });

        tl.to(
          { value: 0 },
          {
            value: num,
            duration: 2.2,
            ease: 'power2.out',
            onUpdate: function () {
              setCount(Math.floor((this.targets()[0] as { value: number }).value));
            },
            onComplete: () => setCount(num),
          },
          '-=0.5'
        );

        tl.to(
          card.querySelector('.stats-progress-bar'),
          { width: '100%', duration: 2.2, ease: 'power2.out' },
          '-=2.2'
        );

        gsap.to(card.querySelector('.stats-icon-ring'), {
          rotate: 360,
          duration: 18,
          repeat: -1,
          ease: 'none',
        });

        gsap.to(card.querySelector('.stats-icon'), {
          y: -6,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.3,
        });
      }, card);
    };

    init();

    return () => {
      ctx?.revert();
    };
  }, [num, index]);

  return (
    <div
      ref={cardRef}
      className="stats-card"
    >
      <div className="stats-card-shine" />
      <div className="stats-card-glow" />
      <div className="stats-card-border" />

      <div className="stats-card-inner">
        <span className="stats-watermark">0{index + 1}</span>

        <div className="stats-icon-wrap">
          <div className="stats-icon-ring" />
          <div className="stats-icon">{icon}</div>
        </div>

        <div className="stats-number">
          <span className="stats-number-value">{count.toLocaleString()}</span>
          <span className="stats-number-suffix">{suffix}</span>
        </div>

        <div className="stats-label">{label}</div>

        <div className="stats-progress">
          <div className="stats-progress-bar" />
        </div>
      </div>
    </div>
  );
}
