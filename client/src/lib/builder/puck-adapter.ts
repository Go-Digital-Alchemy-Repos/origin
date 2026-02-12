import type { ComponentPropField, RegistryComponent } from "../../../../shared/component-registry";
import type { Config, Field } from "@puckeditor/core";

function mapPropFieldToPuckField(field: ComponentPropField): Field<any> {
  switch (field.type) {
    case "string":
      return {
        type: "text",
        label: field.label,
      } as Field<any>;

    case "richtext":
      return {
        type: "textarea",
        label: field.label,
      } as Field<any>;

    case "number":
      return {
        type: "number",
        label: field.label,
        ...(field.min !== undefined ? { min: field.min } : {}),
        ...(field.max !== undefined ? { max: field.max } : {}),
      } as Field<any>;

    case "boolean":
      return {
        type: "radio",
        label: field.label,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      } as Field<any>;

    case "enum":
      return {
        type: "select",
        label: field.label,
        options: (field.options || []).map((opt) => ({
          label: opt.charAt(0).toUpperCase() + opt.slice(1),
          value: opt,
        })),
      } as Field<any>;

    case "image":
      return {
        type: "text",
        label: field.label,
      } as Field<any>;

    case "color":
      return {
        type: "text",
        label: field.label,
      } as Field<any>;

    case "array":
      return {
        type: "textarea",
        label: field.label + " (JSON)",
      } as Field<any>;

    case "object":
      return {
        type: "textarea",
        label: field.label + " (JSON)",
      } as Field<any>;

    default:
      return {
        type: "text",
        label: field.label,
      } as Field<any>;
  }
}

function buildDefaultProps(component: RegistryComponent): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of component.propSchema) {
    if (field.default !== undefined) {
      if (field.type === "array" || field.type === "object") {
        defaults[field.name] = JSON.stringify(field.default, null, 2);
      } else {
        defaults[field.name] = field.default;
      }
    }
  }
  const presetProps = component.defaultPreset.props;
  for (const [key, val] of Object.entries(presetProps)) {
    if (defaults[key] === undefined) {
      const fieldDef = component.propSchema.find((f) => f.name === key);
      if (fieldDef && (fieldDef.type === "array" || fieldDef.type === "object")) {
        defaults[key] = JSON.stringify(val, null, 2);
      } else {
        defaults[key] = val;
      }
    }
  }
  return defaults;
}

export function registryToPuckConfig(
  registry: RegistryComponent[],
  componentRenderMap: Record<string, React.ComponentType<any>>,
): Config {
  const components: Record<string, any> = {};

  for (const comp of registry) {
    if (comp.status === "deprecated") continue;

    const fields: Record<string, Field<any>> = {};
    for (const field of comp.propSchema) {
      fields[field.name] = mapPropFieldToPuckField(field);
    }

    const RenderComponent = componentRenderMap[comp.slug];
    if (!RenderComponent) continue;

    components[comp.slug] = {
      label: comp.name,
      fields,
      defaultProps: buildDefaultProps(comp),
      render: RenderComponent,
    };
  }

  return {
    components,
  };
}

export function getRegistryCategories(registry: RegistryComponent[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {};
  for (const comp of registry) {
    if (comp.status === "deprecated") continue;
    if (!categories[comp.category]) {
      categories[comp.category] = [];
    }
    categories[comp.category].push(comp.slug);
  }
  return categories;
}
