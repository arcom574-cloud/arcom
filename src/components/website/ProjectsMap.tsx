'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import type { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

type ProjectItem = {
  id: string; name: string; location: string; type: string;
  units: number; price: string; lat: number; lng: number;
  slug: string; img: string;
};

export default function ProjectsMap() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ id: string; marker: Marker; popup: Popup }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseAdmin.from('projects').select('*').eq('active', true).order('order_num');
      if (data) {
        setProjects(data.filter((p: any) => p.lat && p.lng).map((p: any) => ({
          id: p.id, name: isAr ? p.name_ar : p.name_en,
          location: isAr ? p.location_ar : p.location_en,
          type: isAr ? p.type_ar : p.type_en,
          units: p.units, price: p.price, lat: +p.lat, lng: +p.lng,
          slug: p.slug, img: p.img,
        })));
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (projects.length === 0 || !mapRef.current) return;

    let cancelled = false;
    let map: MapLibreMap | null = null;
    const avgLat = projects.reduce((s, p) => s + p.lat, 0) / projects.length;
    const avgLng = projects.reduce((s, p) => s + p.lng, 0) / projects.length;

    const init = async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled || !mapRef.current) return;

      map = new maplibregl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        center: [avgLng, avgLat],
        zoom: 12,
        pitch: 50,
        bearing: -15,
        minZoom: 8,
        maxZoom: 18,
        attributionControl: false,
        interactive: true,
        dragRotate: true,
        touchPitch: true,
      });

      mapInstanceRef.current = map;

      map.on('load', () => {
        if (cancelled || !map) return;
        const m = map;

        m.getStyle().layers.forEach((layer) => {
          if (layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout) {
            try {
              m.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name_en'], ['get', 'name:en'], ['get', 'name']]);
              m.setPaintProperty(layer.id, 'text-halo-width', 1.5);
              m.setPaintProperty(layer.id, 'text-halo-color', '#0D1B2A');
              m.setPaintProperty(layer.id, 'text-color', '#c8d8ec');
            } catch {}
          }
        });

        const labelLayer = m.getStyle().layers.find(l => l.type === 'symbol' && l.layout && 'text-field' in l.layout);
        if (m.getSource('carto')) {
          ['building', 'building-top'].forEach(id => { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'none'); });
          m.addLayer({
            id: 'arcom-3d', source: 'carto', 'source-layer': 'building', type: 'fill-extrusion', minzoom: 12,
            paint: {
              'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'render_height'], 0, '#0f1e33', 50, '#1B4B8A', 120, '#2d6cb5', 200, '#4A90D9'],
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.85,
            },
          }, labelLayer?.id);
        }

        markersRef.current = projects.map((project) => {
          const popupHtml = `
            <div style="background:rgba(10,15,26,0.95);backdrop-filter:blur(20px);border:1px solid rgba(74,144,217,0.35);border-radius:20px;padding:0;min-width:260px;font-family:Cairo,sans-serif;direction:rtl;box-shadow:0 20px 60px rgba(0,0,0,0.6);overflow:hidden;">
              ${project.img ? `<div style="height:120px;background-image:url(${project.img});background-size:cover;background-position:center;position:relative;"><div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(10,15,26,0.95) 100%);"></div><div style="position:absolute;bottom:10px;right:14px;background:rgba(74,144,217,0.2);border:1px solid rgba(74,144,217,0.4);padding:3px 10px;border-radius:20px;color:#4A90D9;font-size:10px;font-weight:700;">${project.type}</div></div>` : ''}
              <div style="padding:16px 18px 18px;">
                <div style="color:white;font-size:18px;font-weight:800;margin-bottom:6px;">${project.name}</div>
                <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:4px;">📍 ${project.location}</div>
                <div style="display:flex;gap:12px;margin-bottom:14px;">
                  <span style="color:rgba(255,255,255,0.35);font-size:11px;">🏢 ${project.units} ${isAr ? 'وحدة' : 'units'}</span>
                  ${project.price ? `<span style="color:#C9A84C;font-size:11px;font-weight:700;">💰 ${project.price}</span>` : ''}
                </div>
                <a href="/${locale}/projects/${project.slug}" style="display:block;background:linear-gradient(135deg,#1B4B8A,#4A90D9);color:white;text-align:center;padding:10px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;box-shadow:0 4px 20px rgba(27,75,138,0.4);">
                  ${isAr ? 'عرض المشروع ←' : '→ View Project'}
                </a>
              </div>
            </div>`;

          const popup = new maplibregl.Popup({ closeButton: false, offset: 30, className: 'arcom-popup' }).setHTML(popupHtml);

          const el = document.createElement('div');
          el.innerHTML = `
            <div class="arcom-marker">
              <div class="arcom-marker-pulse"></div>
              <div class="arcom-marker-pin">
                <svg width="44" height="56" viewBox="0 0 44 56" fill="none">
                  <defs>
                    <filter id="glow-${project.id}" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feFlood flood-color="#4A90D9" flood-opacity="0.6"/>
                      <feComposite in2="blur" operator="in"/>
                      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <path d="M22 2C11 2 2 11 2 22c0 15 18 32 19.3 33.3a1 1 0 001.4 0C24 54 42 37 42 22 42 11 33 2 22 2z" fill="#1B4B8A" stroke="rgba(74,144,217,0.8)" stroke-width="2" filter="url(#glow-${project.id})"/>
                  <circle cx="22" cy="20" r="9" fill="#4A90D9" stroke="white" stroke-width="2"/>
                  <circle cx="22" cy="20" r="4" fill="white"/>
                </svg>
              </div>
              <div class="arcom-marker-label">${project.name}</div>
            </div>`;
          el.style.cursor = 'pointer';

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([project.lng, project.lat])
            .setPopup(popup)
            .addTo(m);

          el.addEventListener('click', () => { setActive(project.id); });

          return { id: project.id, marker, popup };
        });

        if (projects.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          projects.forEach(p => bounds.extend([p.lng, p.lat]));
          m.fitBounds(bounds, { padding: 100, maxZoom: 13, pitch: 50 });
        }

        setMapReady(true);
      });
    };

    init();
    return () => {
      cancelled = true;
      setMapReady(false);
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapInstanceRef.current = null;
    };
  }, [projects]);

  const handleProjectClick = (project: ProjectItem) => {
    setActive(project.id);
    const map = mapInstanceRef.current;
    const found = markersRef.current.find(m => m.id === project.id);
    if (!map || !found) return;

    markersRef.current.forEach(({ marker }) => marker.getElement().classList.remove('arcom-marker-active'));
    found.marker.getElement().classList.add('arcom-marker-active');

    map.flyTo({ center: [project.lng, project.lat], zoom: 15, pitch: 55, bearing: -20, duration: 2000, essential: true });
    markersRef.current.forEach(({ popup }) => { if (popup.isOpen()) popup.remove(); });
    found.marker.togglePopup();
  };

  if (projects.length === 0) return null;

  return (
    <section style={{ padding: isMobile ? '60px 0' : '100px 0', backgroundColor: '#050A14', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      {!isMobile && <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(27,75,138,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />}

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '56px', direction: 'rtl' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: '50px', padding: '6px 20px', marginBottom: '16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4A90D9', boxShadow: '0 0 8px #4A90D9' }} />
            <span style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '3px', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>OUR LOCATIONS</span>
          </div>
          <h2 style={{ fontSize: isMobile ? '28px' : '44px', fontWeight: 900, color: 'white', margin: '0 0 8px', fontFamily: 'Cairo, sans-serif', letterSpacing: '-1px' }}>
            {isAr ? 'مشاريعنا على الخريطة' : 'Our Projects on the Map'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? '13px' : '15px', margin: 0, fontFamily: 'Cairo, sans-serif' }}>
            {isAr ? `${projects.length} مشاريع تجارية في أفضل المواقع` : `${projects.length} commercial projects in prime locations`}
          </p>
        </div>

        {/* Map + Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: '20px', alignItems: 'start' }}>

          {/* Map */}
          <div style={{ borderRadius: isMobile ? '16px' : '24px', overflow: 'hidden', border: '1px solid rgba(74,144,217,0.2)', boxShadow: isMobile ? '0 8px 32px rgba(0,0,0,0.3)' : '0 0 0 1px rgba(74,144,217,0.05), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px rgba(27,75,138,0.15)', height: isMobile ? '350px' : '600px', position: 'relative', background: '#0D1B2A' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} dir="ltr" lang="en" />

            {/* Badge */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74,144,217,0.25)', borderRadius: '50px', padding: '8px 16px', zIndex: 2 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4A90D9', boxShadow: '0 0 10px #4A90D9', animation: 'mapPulse 2s ease-in-out infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {isAr ? 'خريطة تفاعلية 3D' : '3D Interactive Map'}
              </span>
            </div>

            {/* Loading */}
            {!mapReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0D1B2A', zIndex: 1, fontFamily: 'Cairo, sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(74,144,217,0.15)', borderTopColor: '#4A90D9', borderRadius: '50%', animation: 'mapSpin 0.8s linear infinite' }} />
                {isAr ? 'جاري تحميل الخريطة...' : 'Loading map...'}
              </div>
            )}
          </div>

          {/* Sidebar / Mobile Cards */}
          <div style={{ direction: isAr ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
            {!isMobile && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '12px' }}>
                {isAr ? 'اضغط على مشروع لعرض موقعه' : 'Click a project to view its location'}
              </p>
            )}
            <div style={isMobile ? { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollSnapType: 'x mandatory' } : { display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map(p => (
                <div key={p.id} onClick={() => handleProjectClick(p)}
                  style={{ display: 'flex', gap: isMobile ? '10px' : '14px', alignItems: 'center', padding: isMobile ? '12px' : '14px 16px', borderRadius: isMobile ? '12px' : '16px', cursor: 'pointer', transition: 'all 0.3s', backgroundColor: active === p.id ? 'rgba(27,75,138,0.25)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active === p.id ? 'rgba(74,144,217,0.5)' : 'rgba(255,255,255,0.06)'}`, ...(isMobile ? { minWidth: '220px', flexShrink: 0, scrollSnapAlign: 'start' } : {}) }}
                >
                  {p.img ? (
                    <img src={p.img} alt="" style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: isMobile ? '10px' : '12px', objectFit: 'cover', flexShrink: 0, border: active === p.id ? '2px solid rgba(74,144,217,0.5)' : '2px solid transparent' }} />
                  ) : (
                    <div style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: isMobile ? '10px' : '12px', backgroundColor: 'rgba(74,144,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '16px' : '20px', flexShrink: 0 }}>🏢</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#4A90D9', fontSize: isMobile ? '9px' : '10px', letterSpacing: '1px', marginBottom: '2px' }}>{p.type}</div>
                    <div style={{ color: 'white', fontSize: isMobile ? '13px' : '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? '10px' : '11px', marginTop: '2px' }}>📍 {p.location}</div>
                  </div>
                  {!isMobile && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: active === p.id ? '#4A90D9' : 'rgba(255,255,255,0.1)', boxShadow: active === p.id ? '0 0 12px #4A90D9' : 'none', transition: 'all 0.3s', flexShrink: 0 }} />}
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href={`/${locale}/projects`} style={{ display: 'block', marginTop: '16px', textAlign: 'center', padding: isMobile ? '10px' : '12px', borderRadius: '12px', backgroundColor: 'rgba(27,75,138,0.15)', border: '1px solid rgba(74,144,217,0.25)', color: '#4A90D9', textDecoration: 'none', fontSize: '13px', fontWeight: 700, transition: 'all 0.3s' }}>
              {isAr ? 'عرض كل المشاريع ←' : '→ View All Projects'}
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mapPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes mapSpin { to { transform: rotate(360deg); } }
        @keyframes markerFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes markerPulseRing {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .arcom-marker { position: relative; display: flex; flex-direction: column; align-items: center; }
        .arcom-marker-pulse {
          position: absolute; bottom: 0; width: 20px; height: 20px;
          border-radius: 50%; background: rgba(74,144,217,0.3);
          animation: markerPulseRing 2s ease-out infinite;
        }
        .arcom-marker-pin {
          position: relative; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          animation: markerFloat 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .arcom-marker:hover .arcom-marker-pin,
        .arcom-marker-active .arcom-marker-pin {
          transform: scale(1.2) translateY(-6px);
          animation: none;
        }
        .arcom-marker-label {
          margin-top: -4px; background: rgba(5,10,20,0.85); backdrop-filter: blur(8px);
          border: 1px solid rgba(74,144,217,0.3); border-radius: 8px;
          padding: 3px 10px; color: white; font-size: 11px;
          font-family: Cairo, sans-serif; font-weight: 700; white-space: nowrap;
          opacity: 0; transition: opacity 0.3s; pointer-events: none;
        }
        .arcom-marker:hover .arcom-marker-label,
        .arcom-marker-active .arcom-marker-label { opacity: 1; }

        .arcom-popup .maplibregl-popup-content {
          background: transparent !important; border: none !important;
          box-shadow: none !important; padding: 0 !important;
        }
        .arcom-popup .maplibregl-popup-tip { display: none !important; }
        .maplibregl-canvas { outline: none; }
        .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left { display: none; }

        @media (max-width: 900px) {
          .arcom-marker-label { display: none; }
        }
      `}</style>
    </section>
  );
}
