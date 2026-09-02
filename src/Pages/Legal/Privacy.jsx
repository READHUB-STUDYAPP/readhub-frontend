import LegalDocument from './LegalDocument';
import { privacyPolicy } from './privacyPolicy';

export default function Privacy() {
  return <LegalDocument document={privacyPolicy} />;
}
