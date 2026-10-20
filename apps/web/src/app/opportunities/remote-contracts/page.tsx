import { DiscoveryHubPage } from '../../../components/discovery-hub';
import { discoveryMetadata } from '../../../lib/discovery-hubs';

export const metadata = discoveryMetadata('remote-contracts');
export default function Page() {
  return <DiscoveryHubPage id="remote-contracts" />;
}
