import Header from '@/components/Header';
import MovieDetail from '@/components/MovieDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <MovieDetail movieId={id} />
    </div>
  );
}
