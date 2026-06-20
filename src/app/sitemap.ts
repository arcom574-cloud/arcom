import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default async function sitemap() {
  const { data: projects } = await supabase
    .from('projects')
    .select('slug, updated_at')
    .eq('active', true);

  const projectUrls = (projects || []).flatMap(p => [
    { url: `https://www.arcomdevelopments.com/ar/projects/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `https://www.arcomdevelopments.com/en/projects/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly' as const, priority: 0.8 },
  ]);

  return [
    { url: 'https://www.arcomdevelopments.com/ar', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: 'https://www.arcomdevelopments.com/en', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: 'https://www.arcomdevelopments.com/ar/projects', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: 'https://www.arcomdevelopments.com/en/projects', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: 'https://www.arcomdevelopments.com/ar/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: 'https://www.arcomdevelopments.com/en/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: 'https://www.arcomdevelopments.com/ar/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: 'https://www.arcomdevelopments.com/en/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    ...projectUrls,
  ];
}
