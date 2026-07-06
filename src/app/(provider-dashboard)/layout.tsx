import type { Metadata } from 'next';
import ProviderDashboardLayoutClient from './provider-dashboard-layout';

export const metadata: Metadata = {
  manifest: '/provider-manifest.json',
};

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProviderDashboardLayoutClient>{children}</ProviderDashboardLayoutClient>;
}
