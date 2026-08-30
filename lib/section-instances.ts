export const DEFAULT_INSTANCE_ID = "__default__";

export type SectionInstance = {
  id: string;
  basePage: number;
  label: string;
  createdAt: string;
};

export function createSectionInstance(basePage: number, label: string): SectionInstance {
  return {
    id: crypto.randomUUID(),
    basePage,
    label,
    createdAt: new Date().toISOString(),
  };
}

export function getInstancesForPage(
  instances: SectionInstance[],
  basePage: number,
): SectionInstance[] {
  return instances
    .filter((item) => item.basePage === basePage)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** All copies for a section page, including the built-in first copy. */
export function getAllCopiesForPage(
  instances: SectionInstance[],
  basePage: number,
): { id: string; label: string; isDefault: boolean }[] {
  const extras = getInstancesForPage(instances, basePage);
  return [
    { id: DEFAULT_INSTANCE_ID, label: "Copy 1", isDefault: true },
    ...extras.map((item, index) => ({
      id: item.id,
      label: item.label || `Copy ${index + 2}`,
      isDefault: false,
    })),
  ];
}

export function resolveActiveInstanceId(
  activeByPage: Record<number, string>,
  basePage: number,
  instances: SectionInstance[],
): string {
  const active = activeByPage[basePage];
  if (!active || active === DEFAULT_INSTANCE_ID) return DEFAULT_INSTANCE_ID;

  const exists = instances.some((item) => item.id === active && item.basePage === basePage);
  return exists ? active : DEFAULT_INSTANCE_ID;
}

export function annotationMatchesInstance(
  annotation: { instanceId?: string },
  activeInstanceId: string,
): boolean {
  const stored = annotation.instanceId ?? DEFAULT_INSTANCE_ID;
  return stored === activeInstanceId;
}

export function nextCopyLabel(baseLabel: string, existingCount: number) {
  return `${baseLabel} ${existingCount + 1}`;
}
