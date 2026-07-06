import { NextRequest, NextResponse } from 'next/server';
import { getProviderByUsername } from '@/lib/data';

type Params = {
  username: string;
};

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { username } = await params;
    const provider = await getProviderByUsername(username);

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const appName = provider.name || 'BroBookMe Booking';
    const appDescription = provider.description || `Book an appointment with ${provider.name} on BroBookMe.`;
    const appLogo = provider.logoUrl || '/android-chrome-192x192.png';

    const manifest = {
      name: appName,
      short_name: appName.slice(0, 12),
      description: appDescription,
      icons: [
        {
          src: appLogo,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: appLogo,
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      start_url: `/${username}`,
      scope: `/${username}`,
      display: "standalone"
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating dynamic PWA manifest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
