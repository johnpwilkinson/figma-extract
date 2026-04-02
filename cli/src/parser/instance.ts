/**
 * Extracts a Figma INSTANCE node into a ParsedInstance.
 * Resolves component names via the component map and extracts variant properties.
 * Also extracts visual properties (fill, stroke, corner radius, opacity) since
 * instances are visually identical to frames — they have their own fills that
 * may differ across variants (e.g., a selected button is red, unselected is gray).
 */

import type { FigmaNode, FigmaComponentMeta } from "../types/figma-api";
import type { ParsedInstance } from "../types/parsed";
import {
  resolveComponent,
  parseComponentProperties,
} from "../resolvers/component-map";
import {
  resolveFirstSolidFill,
  resolveBorderRadius,
} from "../resolvers/tailwind";

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

  // Visual properties — instances are frames visually
  if (node.fills?.length) {
    const fill = resolveFirstSolidFill(node.fills, "bg");
    if (fill) instance.fill = fill;
  }

  if (node.strokes?.length) {
    const stroke = resolveFirstSolidFill(node.strokes, "border");
    if (stroke) instance.stroke = stroke;
    if (node.strokeWeight) instance.strokeWeight = node.strokeWeight;
  }

  if (node.cornerRadius && node.cornerRadius > 0) {
    instance.cornerRadius = resolveBorderRadius(node.cornerRadius);
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    instance.opacity = node.opacity;
  }

  // Size
  const bb = node.absoluteBoundingBox;
  if (bb) {
    instance.width = Math.round(bb.width) + "px";
    instance.height = Math.round(bb.height) + "px";
  }

  return instance;
}
