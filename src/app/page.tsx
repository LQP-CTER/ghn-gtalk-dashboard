import React from 'react';
import { fetchAndProcessData } from '@/lib/gtalkDataUtils';
import MainDashboard from '@/components/MainDashboard';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const forceRefresh = params.refresh === 'true';
  const reportData = await fetchAndProcessData(forceRefresh);

  return <MainDashboard reportData={reportData} />;
}
