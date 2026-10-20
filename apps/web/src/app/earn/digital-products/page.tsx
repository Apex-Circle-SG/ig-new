import { DiscoveryHubPage } from '../../../components/discovery-hub';
import { discoveryMetadata } from '../../../lib/discovery-hubs';

export const metadata = discoveryMetadata('digital-products');
export default function Page() {
  return <DiscoveryHubPage id="digital-products" />;
}
