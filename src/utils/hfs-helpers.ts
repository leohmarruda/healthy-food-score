/**
 * Helper functions for HFS score management
 */

/**
 * Determine HFS version from hfs_score JSON or use default
 */
export function determineHFSVersion(
  hfsScore: any,
  defaultVersion: string = 'v2'
): string {
  if (hfsScore?.v2) return 'v2';
  if (hfsScore?.v1) return 'v1';
  return defaultVersion;
}

/**
 * Preserve other HFS versions when calculating a specific version
 */
export function preserveOtherVersions(
  existingHfsScore: any,
  versionToCalculate: string
): any {
  const preserved: any = {};
  
  if (existingHfsScore && typeof existingHfsScore === 'object') {
    if (versionToCalculate === 'v1' && existingHfsScore.v2) {
      preserved.v2 = existingHfsScore.v2;
    } else if (versionToCalculate === 'v2' && existingHfsScore.v1) {
      preserved.v1 = existingHfsScore.v1;
    }
  }
  
  return preserved;
}

/**
 * Extract numeric score from hfs_score JSON
 */
export function extractNumericScore(hfsScoreJson: any): number {
  if (hfsScoreJson?.v1?.HFS !== undefined) {
    return hfsScoreJson.v1.HFS;
  }
  if (hfsScoreJson?.v1?.HFSv1 !== undefined) {
    return hfsScoreJson.v1.HFSv1;
  }
  if (hfsScoreJson?.v2?.hfs_score !== undefined) {
    return hfsScoreJson.v2.hfs_score;
  }
  return -1;
}

/**
 * Normalize score values to numbers (0 if undefined/null)
 */
export function normalizeScores(scores: Record<string, any>): Record<string, number> {
  const normalized: Record<string, number> = {};
  
  Object.keys(scores).forEach(key => {
    const value = scores[key];
    normalized[key] = typeof value === 'number' && !isNaN(value) ? value : 0;
  });
  
  return normalized;
}



