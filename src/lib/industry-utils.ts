import { IndustryType, industries, IndustryConfig, FieldDef } from "@/config/industries";

export type { FieldDef };

/**
 * Gets the full configuration for a specific industry type
 */
export function getIndustryConfig(type: IndustryType | string): IndustryConfig {
    return industries[type as IndustryType] || industries.GENERAL;
}

/**
 * Gets a localized label for a specific key based on the shop's industry
 * Usage: getIndustryLabel(shop, "serviceIdentifier") -> "IMEI / Seri No" or "Sayaç No"
 */
export function getIndustryLabel(shop: any | null | undefined, key: keyof IndustryConfig["labels"]): string {
    if (!shop) return industries.GENERAL.labels[key];
    const config = getIndustryConfig(shop.industry);
    return (config.labels as any)[key] || (industries.GENERAL.labels as any)[key];
}

/**
 * Checks if a specific module is enabled for the given shop
 */
export function isModuleEnabled(shop: any | null | undefined, moduleName: string): boolean {
    if (!shop) return true;

    // Optional: Core modules that should always be enabled
    const MANDATORY_MODULES = ["DASHBOARD", "SETTINGS", "PROFILE", "NOTIFICATIONS"];
    if (MANDATORY_MODULES.includes(moduleName)) return true;

    // If the shop has a specific list of enabled modules, use only that
    if (shop.enabledModules !== undefined && shop.enabledModules !== null) {
        // If it's an array, it's a dynamic selection
        if (Array.isArray(shop.enabledModules) && shop.enabledModules.length > 0) {
            return shop.enabledModules.includes(moduleName);
        }
        // If it's an empty array, it means no optional modules are selected
        if (Array.isArray(shop.enabledModules) && shop.enabledModules.length === 0) {
            return false;
        }
    }

    // Fallback to industry defaults if no custom setting exists
    const config = getIndustryConfig(shop.industry);
    return config.features.includes(moduleName);
}

/**
 * Returns the service form field definitions for the shop's industry.
 * Falls back to GENERAL if not found.
 */
export function getServiceFormFields(shop: any | null | undefined): FieldDef[] {
    if (!shop) return industries.GENERAL.serviceFormFields;

    // Check if the AI generated configuration exists
    if (shop.themeConfig?.serviceFields?.length > 0) {
        return shop.themeConfig.serviceFields as FieldDef[];
    }

    const config = getIndustryConfig(shop.industry);
    return config.serviceFormFields;
}

/**
 * Returns the inventory/product form field definitions for the shop's industry.
 */
export function getInventoryFormFields(shop: any | null | undefined): FieldDef[] {
    if (!shop) return industries.GENERAL.inventoryFormFields;

    // Check if the AI generated configuration exists
    if (shop.themeConfig?.productFields?.length > 0) {
        return shop.themeConfig.productFields as FieldDef[];
    }

    const config = getIndustryConfig(shop.industry);
    return config.inventoryFormFields;
}

/**
 * Returns the list of standard accessories for the shop's industry.
 */
export function getIndustryAccessories(shop: any | null | undefined): string[] {
    if (!shop) return industries.GENERAL.accessories || [];

    // Check for user-defined accessories in themeConfig first
    if (shop.themeConfig?.accessories?.length > 0) {
        return shop.themeConfig.accessories as string[];
    }

    const config = getIndustryConfig(shop.industry);
    return config.accessories || industries.GENERAL.accessories || [];
}

/**
 * Extracts the core mapped fields from dynamic form values.
 * Returns { [coreKey]: value, attributes }
 * where attributes contains all non-core fields.
 */
export function extractCoreAndAttributes(
    fields: FieldDef[],
    values: Record<string, any>
): any {
    const core: Record<string, any> = {};
    const attributes: Record<string, any> = {};

    for (const field of fields) {
        const value = values[field.key];
        if (field.coreMapping) {
            core[field.coreMapping] = value ?? "";
        } else {
            if (value !== undefined && value !== "") {
                attributes[field.key] = value;
            }
        }
    }

    return {
        ...core,
        attributes,
    };
}
