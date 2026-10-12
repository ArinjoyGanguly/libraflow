import neo4j from 'neo4j-driver';

/**
 * Recursively converts Neo4j driver types (Integers, Dates, Nodes) into plain JavaScript objects/primitives.
 */
export const toNative = (val: any): any => {
  if (val === null || val === undefined) {
    return val;
  }

  // Neo4j Integer to JS number
  if (neo4j.isInt(val)) {
    return val.inSafeRange() ? val.toNumber() : val.toString();
  }

  // Neo4j Date (e.g. date('2026-10-12'))
  if (val && typeof val === 'object' && 'year' in val && 'month' in val && 'day' in val) {
    const y = String(toNative(val.year)).padStart(4, '0');
    const m = String(toNative(val.month)).padStart(2, '0');
    const d = String(toNative(val.day)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Neo4j Node
  if (val && typeof val === 'object' && 'properties' in val && 'labels' in val) {
    return toNative(val.properties);
  }

  // Arrays
  if (Array.isArray(val)) {
    return val.map(toNative);
  }

  // Objects
  if (typeof val === 'object' && val.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = toNative(v);
    }
    return result;
  }

  return val;
};

/**
 * Strips sensitive fields (such as passwordHash) from entity objects.
 */
export const sanitizeEntity = <T extends Record<string, any>>(entity: T): Omit<T, 'passwordHash'> => {
  if (!entity || typeof entity !== 'object') return entity;
  const { passwordHash, ...rest } = entity;
  return rest as Omit<T, 'passwordHash'>;
};
