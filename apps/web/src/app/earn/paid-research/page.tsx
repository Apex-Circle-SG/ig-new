import { DiscoveryHubPage } from '../../../components/discovery-hub';
import { discoveryMetadata } from '../../../lib/discovery-hubs';

export const metadata = discoveryMetadata('paid-research');
export default function Page() {
  return <DiscoveryHubPage id="paid-research" />;
}
