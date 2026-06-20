'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Project = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  location_ar: string;
  location_en: string;
  type_ar: string;
  type_en: string;
  status_ar: string;
  status_en: string;
  desc_ar: string;
  desc_en: string;
  img: string;
  order_num: number;
  active: boolean;
};

function MobileProjects({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';

  if (!projects.length) return null;

  return (
    <section style={{ backgroundColor: '#050A14', padding: '40px 0 100px' }}>
      <div style={{ textAlign: 'center', padding: '0 24px 32px' }}>
        <p style={{ color: '#4A90D9', fontSize: '10px', letterSpacing: '5px', marginBottom: '12px' }}>OUR PROJECTS</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: 0 }}>أبرز مشاريعنا</h2>
      </div>

      <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${projects[active]?.img})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'all 0.5s ease' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #050A14 100%)' }} />
        <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(27,75,138,0.8)', border: '1px solid rgba(74,144,217,0.5)', borderRadius: '50px', padding: '4px 14px', color: '#4A90D9', fontSize: '11px', letterSpacing: '2px' }}>
          {isAr ? projects[active]?.type_ar : projects[active]?.type_en}
        </div>
      </div>

      <div style={{ padding: '0 24px', direction: 'rtl' }}>
        <h3 style={{ fontSize: '28px', fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-1px' }}>
          {isAr ? projects[active]?.name_ar : projects[active]?.name_en}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '12px' }}>
          📍 {isAr ? projects[active]?.location_ar : projects[active]?.location_en}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>
          {isAr ? projects[active]?.desc_ar : projects[active]?.desc_en}
        </p>
        <Link href={`/${locale}/projects/${projects[active]?.slug}`} style={{ display: 'block', backgroundColor: '#1B4B8A', color: 'white', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, textAlign: 'center', boxShadow: '0 8px 32px rgba(27,75,138,0.4)', marginBottom: '24px' }}>
          عرض المشروع ←
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '0 24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {projects.map((p, i) => (
          <div key={p.id} onClick={() => setActive(i)} style={{ flexShrink: 0, width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: active === i ? '2px solid #4A90D9' : '2px solid transparent', transition: 'all 0.3s' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${p.img})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: active === i ? 'none' : 'brightness(0.4)', transition: 'filter 0.3s' }} />
            <div style={{ position: 'absolute', bottom: '6px', right: '6px', color: 'white', fontSize: '10px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {isAr ? p.name_ar : p.name_en}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DesktopProjects({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';

  useEffect(() => {
    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!sectionRef.current) return;
      const panels = sectionRef.current?.querySelectorAll('.project-panel');
      panels?.forEach((panel) => {
        const img = panel.querySelector('.project-img') as HTMLElement;
        const content = panel.querySelector('.project-content') as HTMLElement;
        if (!img || !content) return;
        gsap.fromTo(img, { scale: 1.1 }, { scale: 1, scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
        gsap.fromTo(content, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 70%' } });
      });
    };
    if (projects.length) init();
  }, [projects]);

  if (!projects.length) return null;

  return (
    <section ref={sectionRef} style={{ backgroundColor: '#050A14' }}>
      <div style={{ textAlign: 'center', padding: '100px 32px 60px' }}>
        <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>OUR PROJECTS</p>
        <h2 style={{ fontSize: '52px', fontWeight: 800, color: 'white', margin: 0 }}>أبرز مشاريعنا</h2>
      </div>

      {projects.map((p, i) => (
        <div key={p.id} className="project-panel" style={{ position: 'relative', height: '85vh', overflow: 'hidden', marginBottom: '4px' }}>
          <div className="project-img" style={{ position: 'absolute', inset: '-10%', backgroundImage: `url(${p.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: i % 2 === 0 ? 'linear-gradient(to right, rgba(5,10,20,0.95) 40%, rgba(5,10,20,0.2) 100%)' : 'linear-gradient(to left, rgba(5,10,20,0.95) 40%, rgba(5,10,20,0.2) 100%)' }} />
          <div className="project-content" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [i % 2 === 0 ? 'left' : 'right']: '8%', maxWidth: '480px', direction: 'rtl' }}>
            <div style={{ display: 'inline-block', backgroundColor: 'rgba(74,144,217,0.15)', border: '1px solid rgba(74,144,217,0.4)', borderRadius: '50px', padding: '6px 20px', color: '#4A90D9', fontSize: '11px', letterSpacing: '3px', marginBottom: '20px' }}>
              {isAr ? p.type_ar : p.type_en}
            </div>
            <h3 style={{ fontSize: '52px', fontWeight: 900, color: 'white', margin: '0 0 12px', lineHeight: 1.1, textShadow: '0 0 40px rgba(74,144,217,0.3)' }}>
              {isAr ? p.name_ar : p.name_en}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '8px' }}>
              📍 {isAr ? p.location_ar : p.location_en}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: 1.8, marginBottom: '32px' }}>
              {isAr ? p.desc_ar : p.desc_en}
            </p>
            <Link href={`/${locale}/projects/${p.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: '#1B4B8A', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, boxShadow: '0 0 40px rgba(27,75,138,0.4)' }}>
              {isAr ? 'عرض المشروع ←' : 'View Project →'}
            </Link>
          </div>
          <div style={{ position: 'absolute', bottom: '32px', [i % 2 === 0 ? 'right' : 'left']: '5%', fontSize: '120px', fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>
            0{i + 1}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '60px 32px 80px' }}>
        <Link href={`/${locale}/projects`} style={{ border: '1px solid rgba(74,144,217,0.4)', color: '#4A90D9', padding: '16px 52px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>
          عرض كل المشاريع
        </Link>
      </div>
    </section>
  );
}

export default function ProjectsSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    setMounted(true);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('projects').select('*').eq('active', true).order('order_num');
      if (data) setProjects(data);
    };
    load();
  }, []);

  if (!mounted) return <DesktopProjects projects={projects} />;
  return isMobile ? <MobileProjects projects={projects} /> : <DesktopProjects projects={projects} />;
}