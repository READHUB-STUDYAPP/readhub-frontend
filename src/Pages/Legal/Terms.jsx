import LegalDocument from './LegalDocument';
import { termsOfService } from './termsOfService';

export default function Terms() {
  return <LegalDocument document={termsOfService} />;
}
