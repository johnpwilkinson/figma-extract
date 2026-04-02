/**
 * Extracts a Figma INSTANCE node into a ParsedInstance.
 * Resolves component names via the component map and extracts variant properties.
 */

import type { FigmaNode, FigmaComponentMeta } from "../types/figma-api";
import type { ParsedInstance } from "../types/parsed";
import {
  resolveComponent,
  parseComponentProperties,
} from "../resolvers/component-map";

export interface InstanceExtractOptions {
  components: Record<string, FigmaComponentMeta>;
  configComponentMap?: Record<string, string>;
}

export function extractInstance(
  node: FigmaNode,
  options: InstanceExtractOptions,
): ParsedInstance {
  const meta = node.componentId ? options.components[node.componentId] : undefined;
  const componentName = meta?.name ?? node.name;
  const isRemote = meta?.remote ?? false;

  const resolution = resolveComponent(componentName, {
    remote: isRemote,
    configMap: options.configComponentMap,
  });

  const variantProperties = node.componentProperties
    ? parseComponentProperties(node.componentProperties)
    : undefined;

  const overrides = node.overrides
    ?.filter((o) => o.overriddenFields.length > 0)
    .map((o) => o.overriddenFields.join(", "));

  const instance: ParsedInstance = {
    type: "INSTANCE",
    name: node.name,
    figmaId: node.id,
    componentName: resolution.original,
    isRemote: resolution.isRemote,
  };

  if (resolution.mapped) {
    instance.mappedComponent = resolution.mapped;
  }

  if (variantProperties && Object.keys(variantProperties).length > 0) {
    instance.variantProperties = variantProperties;
  }

  if (overrides && overrides.length > 0) {
    instance.overrides = overrides;
  }

  return instance;
}
