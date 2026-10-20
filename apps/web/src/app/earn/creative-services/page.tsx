import { DiscoveryHubPage } from '../../../components/discovery-hub';
import { discoveryMetadata } from '../../../lib/discovery-hubs';

export const metadata = discoveryMetadata('creative-services');
export default function Page() {
  return <DiscoveryHubPage id="creative-services" />;
}
