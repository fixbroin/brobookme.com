import type { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  return {
    manifest: `/api/manifest/${username}`,
  };
}

export default function ProviderPublicLayout({ children }: Props) {
  return <>{children}</>;
}
