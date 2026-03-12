import { getLatestCandidates } from "@/lib/trading-queries";
import CandidatesShell from "@/components/trading/candidates-shell";

export const revalidate = 1800;

export default async function CandidatesPage() {
  const candidates = await getLatestCandidates(500);
  return <CandidatesShell candidates={candidates} />;
}
