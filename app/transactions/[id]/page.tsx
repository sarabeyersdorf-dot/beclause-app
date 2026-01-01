import UploadPageClient from './UploadPageClient';

export default function Page({ params }: { params: { id: string } }) {
  return <UploadPageClient id={params.id} />;
}
