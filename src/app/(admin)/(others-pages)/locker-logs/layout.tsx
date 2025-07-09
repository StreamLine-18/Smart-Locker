import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Locker Activity Logs | Smart Locker Admin',
  description: 'View real-time locker activity logs for the Smart Locker system',
};

export default function LockerLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
