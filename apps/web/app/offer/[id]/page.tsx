import { OFFER_IDS } from '../../../lib/config';
import OfferView from './OfferView';

export const dynamicParams = false;

export function generateStaticParams() {
  return OFFER_IDS.map((id) => ({ id }));
}

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OfferView id={id} />;
}
