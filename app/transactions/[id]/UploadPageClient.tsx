'use client';
import TxnUploader from '@/app/components/TxnUploader';

export default function UploadPageClient({ id }: { id: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Transaction {id}</h1>
      <p>Upload a document for this transaction:</p>
      <TxnUploader transactionId={id} />
    </div>
  );
}
