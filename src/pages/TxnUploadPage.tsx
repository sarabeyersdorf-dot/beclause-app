import { useParams } from 'react-router-dom';
import TxnUploader from '../components/TxnUploader';

export default function TxnUploadPage() {
  const { id } = useParams();
  if (!id) return <p>Missing transaction id</p>;
  return (
    <div style={{ padding: 24 }}>
      <h1>Transaction {id}</h1>
      <p>Upload a document for this transaction:</p>
      <TxnUploader transactionId={id} />
    </div>
  );
}
