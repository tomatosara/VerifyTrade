import { DataSource, EntityManager, type EntityMetadata } from 'typeorm';

const DEFAULT_INTENDED_TABLES = [
  'trade_audit_events',
  'trade_confirmations',
  'trade_forms'
] as const;

const MANUAL_DEPENDENCIES: Record<string, string[]> = {
  trade_audit_events: ['trade_forms'],
  trade_confirmations: ['trade_forms']
};

const normalize = (value: string): string => value.replace(/["`]/g, '').toLowerCase();

const quoteIdentifier = (name: string): string => `"${name.replace(/"/g, '""')}"`;

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

const isEntityManager = (candidate: DataSource | EntityManager): candidate is EntityManager =>
  candidate instanceof EntityManager;

const collectEntityMetadata = (
  dataSource: DataSource,
  normalizedTables: Set<string>
): Map<string, EntityMetadata> => {
  const metaByTable = new Map<string, EntityMetadata>();

  for (const meta of dataSource.entityMetadatas) {
    const possibleNames = [
      meta.tableName,
      meta.tablePath,
      meta.givenTableName,
      meta.name,
      meta.tableNameWithoutPrefix
    ].filter(Boolean) as string[];

    for (const candidate of possibleNames) {
      const normalized = normalize(candidate);
      if (normalizedTables.has(normalized)) {
        metaByTable.set(normalized, meta);
        break;
      }
    }
  }

  return metaByTable;
};

const buildParentToChildrenGraph = (
  metas: Map<string, EntityMetadata>,
  normalizedTables: Set<string>
): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();

  for (const table of normalizedTables) {
    graph.set(table, new Set<string>());
  }

  const addEdge = (parent: string, child: string): void => {
    if (!normalizedTables.has(parent) || !normalizedTables.has(child)) {
      return;
    }

    graph.get(parent)?.add(child);
  };

  for (const [childTable, meta] of metas) {
    for (const foreignKey of meta.foreignKeys) {
      const referencedPath =
        foreignKey.referencedEntityMetadata?.tableName ??
        foreignKey.referencedEntityMetadata?.tablePath ??
        foreignKey.referencedTablePath;

      if (!referencedPath) {
        continue;
      }

      const parentTable = normalize(referencedPath);
      addEdge(parentTable, childTable);
    }
  }

  for (const [child, parents] of Object.entries(MANUAL_DEPENDENCIES)) {
    const normalizedChild = normalize(child);
    if (!normalizedTables.has(normalizedChild)) {
      continue;
    }

    for (const parent of parents) {
      addEdge(normalize(parent), normalizedChild);
    }
  }

  return graph;
};

const topologicalOrderParentsFirst = (
  graph: Map<string, Set<string>>
): string[] | null => {
  const inDegree = new Map<string, number>();

  for (const node of graph.keys()) {
    inDegree.set(node, 0);
  }

  for (const children of graph.values()) {
    for (const child of children) {
      inDegree.set(child, (inDegree.get(child) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const ordered: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    ordered.push(current);

    for (const child of graph.get(current) ?? []) {
      const nextDegree = (inDegree.get(child) ?? 0) - 1;
      inDegree.set(child, nextDegree);
      if (nextDegree === 0) {
        queue.push(child);
      }
    }
  }

  return ordered.length === graph.size ? ordered : null;
};

const deleteTableRows = async (
  context: DataSource | EntityManager,
  tableName: string,
  meta: EntityMetadata | undefined
): Promise<void> => {
  if (meta) {
    const repository = context.getRepository(meta.target);
    await repository.delete({});
    return;
  }

  await context.query(`DELETE FROM ${quoteIdentifier(tableName)}`);
};

export async function clearAllForSeed(
  context: DataSource | EntityManager,
  strategy: 'truncate' | 'delete' = 'truncate',
  tables: string[] = [...DEFAULT_INTENDED_TABLES]
): Promise<void> {
  const intendedTables = tables.length > 0 ? tables : [...DEFAULT_INTENDED_TABLES];
  const dataSource = isEntityManager(context) ? context.connection : context;
  const driverType = dataSource.options.type;
  const normalizedToOriginal = new Map<string, string>();
  const normalizedIntended: string[] = [];

  for (const table of intendedTables) {
    const normalized = normalize(table);
    if (!normalizedToOriginal.has(normalized)) {
      normalizedToOriginal.set(normalized, table);
      normalizedIntended.push(normalized);
    }
  }

  if (normalizedIntended.length === 0) {
    return;
  }

  const inferExistingFromMetadata = (): Set<string> => {
    const known = new Set<string>();
    for (const meta of dataSource.entityMetadatas) {
      const names = [
        meta.tableName,
        meta.tablePath,
        meta.givenTableName,
        meta.name,
        meta.tableNameWithoutPrefix
      ].filter(Boolean) as string[];
      for (const name of names) {
        known.add(normalize(name));
      }
    }
    return known;
  };

  let existingTables = new Set<string>();

  if (driverType === 'postgres') {
    const schema =
      ((dataSource.options as { schema?: string | undefined })?.schema ??
        process.env.DB_SCHEMA ??
        'public') || 'public';
    const rows: Array<{ tablename: string }> = await context.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = '${escapeLiteral(schema)}'
    `);
    if (rows.length === 0) {
      existingTables = inferExistingFromMetadata();
    } else {
      existingTables = new Set(rows.map((row) => normalize(row.tablename)));
    }
  } else {
    existingTables = inferExistingFromMetadata();
  }

  const normalizedTargets = normalizedIntended.filter((name) => existingTables.has(name));

  if (normalizedTargets.length === 0) {
    return;
  }

  const targets = normalizedTargets.map((name) => normalizedToOriginal.get(name) ?? name);
  const shouldTruncate = strategy === 'truncate' && driverType === 'postgres';

  if (shouldTruncate) {
    const list = targets.map((name) => quoteIdentifier(name)).join(', ');
    await context.query(`
      TRUNCATE TABLE ${list}
      RESTART IDENTITY CASCADE
    `);
    return;
  }

  const normalizedTargetSet = new Set(normalizedTargets);
  const metadatas = collectEntityMetadata(dataSource, normalizedTargetSet);
  const graph = buildParentToChildrenGraph(metadatas, normalizedTargetSet);
  const parentFirstOrder = topologicalOrderParentsFirst(graph);
  const deleteOrder =
    parentFirstOrder !== null ? parentFirstOrder.reverse() : normalizedTargets;

  for (const normalizedName of deleteOrder) {
    const originalName = normalizedToOriginal.get(normalizedName) ?? normalizedName;
    await deleteTableRows(context, originalName, metadatas.get(normalizedName));
  }
}
