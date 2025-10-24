import Header from '@/components/Header';
import SeriesDetail from '@/components/SeriesDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeriesPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <SeriesDetail seriesId={id} />
    </div>
  );
}
