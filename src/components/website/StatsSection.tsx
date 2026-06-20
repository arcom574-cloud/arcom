'use client';
import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Trophy, Building2, Users, MapPin } from 'lucide-react';
import CounterCard from '@/components/website/CounterCard';

const stats = [
  { num: 15, suffix: '+', labelAr: 'سنة خبرة', labelEn: 'Years Experience', icon: Trophy, accent: '#C9A84C' },
  { num: 50, suffix: '+', labelAr: 'مشروع منجز', labelEn: 'Projects Done', icon: Building2, accent: '#4A90D9' },
  { num: 5000, suffix: '+', labelAr: 'عميل سعيد', labelEn: 'Happy Clients', icon: Users, accent: '#6EC4FF' },
  { num: 10, suffix: '+', labelAr: 'مدينة', labelEn: 'Cities', icon: MapPin, accent: '#E8B4B8' },
];

export default function StatsSection() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let ctx: { revert: () => void } | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        gsap.fromTo('.stats-heading-tag',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 80%', once: true } }
        );
        gsap.fromTo('.stats-heading-title',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.15, scrollTrigger: { trigger: section, start: 'top 80%', once: true } }
        );
        gsap.fromTo('.stats-heading-line',
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: 'power3.inOut', delay: 0.35, scrollTrigger: { trigger: section, start: 'top 80%', once: true } }
        );
      }, section);
    };

    init();
    return () => { ctx?.revert(); };
  }, []);

  return (
    <section ref={sectionRef} className="stats-section">
      <div className="stats-ambient stats-ambient-1" />
      <div className="stats-ambient stats-ambient-2" />
      <div className="stats-grid-bg" />

      <div className="stats-container">
        <div className="stats-heading">
          <p className="stats-heading-tag">NUMBERS SPEAK</p>
          <h2 className="stats-heading-title">{isAr ? 'أرقامنا تتحدث' : 'Our Numbers'}</h2>
          <div className="stats-heading-line" />
        </div>

        <div className="stats-cards">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <CounterCard
                key={stat.labelEn}
                num={stat.num}
                suffix={stat.suffix}
                label={isAr ? stat.labelAr : stat.labelEn}
                index={index}
                icon={<Icon size={26} strokeWidth={1.5} color={stat.accent} />}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        .stats-section { padding: 120px 32px; background-color: #050A14; position: relative; overflow: hidden; }
        .stats-ambient { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px); }
        .stats-ambient-1 { top: 10%; left: 15%; width: 420px; height: 420px; background: radial-gradient(circle, rgba(27,75,138,0.18) 0%, transparent 70%); }
        .stats-ambient-2 { bottom: 5%; right: 10%; width: 360px; height: 360px; background: radial-gradient(circle, rgba(74,144,217,0.1) 0%, transparent 70%); }
        .stats-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(74,144,217,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,144,217,0.03) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 100%); pointer-events: none; }
        .stats-container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
        .stats-heading { text-align: center; margin-bottom: 72px; }
        .stats-heading-tag { color: #4A90D9; font-size: 11px; letter-spacing: 6px; margin-bottom: 16px; font-weight: 600; }
        .stats-heading-title { color: white; font-size: clamp(32px, 5vw, 48px); font-weight: 800; margin: 0 0 24px; line-height: 1.2; }
        .stats-heading-line { width: 80px; height: 3px; margin: 0 auto; background: linear-gradient(90deg, transparent, #4A90D9, transparent); transform-origin: center; border-radius: 2px; }
        .stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .stats-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .stats-cards { grid-template-columns: 1fr; } }
        .stats-card { position: relative; border-radius: 28px; padding: 1px; background: linear-gradient(145deg, rgba(74,144,217,0.35), rgba(27,75,138,0.08) 40%, rgba(255,255,255,0.04)); transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease; cursor: default; }
        .stats-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 80px rgba(27,75,138,0.35), 0 0 0 1px rgba(74,144,217,0.2); }
        .stats-card-shine { position: absolute; inset: 0; border-radius: 28px; overflow: hidden; pointer-events: none; z-index: 2; }
        .stats-card-shine::after { content: ''; position: absolute; top: 0; left: -120%; width: 60%; height: 100%; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%); transition: left 0.7s ease; }
        .stats-card:hover .stats-card-shine::after { left: 140%; }
        .stats-card-glow { position: absolute; inset: -1px; border-radius: 28px; background: radial-gradient(ellipse at 50% 0%, rgba(74,144,217,0.25) 0%, transparent 65%); opacity: 0; transition: opacity 0.5s ease; pointer-events: none; }
        .stats-card:hover .stats-card-glow { opacity: 1; }
        .stats-card-border { display: none; }
        .stats-card-inner { position: relative; padding: 40px 28px 36px; border-radius: 27px; background: linear-gradient(160deg, rgba(13,27,42,0.95) 0%, rgba(5,10,20,0.88) 100%); backdrop-filter: blur(20px); overflow: hidden; text-align: center; min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .stats-watermark { position: absolute; top: 12px; left: 16px; font-size: 64px; font-weight: 900; line-height: 1; color: rgba(74,144,217,0.04); pointer-events: none; user-select: none; }
        .stats-icon-wrap { position: relative; width: 64px; height: 64px; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; }
        .stats-icon-ring { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed rgba(74,144,217,0.25); }
        .stats-icon { position: relative; z-index: 1; width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, rgba(74,144,217,0.15), rgba(27,75,138,0.08)); border: 1px solid rgba(74,144,217,0.2); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(27,75,138,0.2); }
        .stats-number { display: flex; align-items: baseline; justify-content: center; gap: 2px; margin-bottom: 10px; line-height: 1; }
        .stats-number-value { font-size: clamp(44px, 5vw, 56px); font-weight: 900; font-variant-numeric: tabular-nums; background: linear-gradient(135deg, #ffffff 0%, #a8d4ff 45%, #4A90D9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stats-number-suffix { font-size: 28px; font-weight: 800; color: #4A90D9; -webkit-text-fill-color: #4A90D9; }
        .stats-label { font-size: 13px; color: rgba(255,255,255,0.45); letter-spacing: 2px; font-weight: 500; }
        .stats-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(74,144,217,0.08); overflow: hidden; }
        .stats-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #1B4B8A, #4A90D9, #6EC4FF); border-radius: 0 2px 2px 0; }
      `}</style>
    </section>
  );
}