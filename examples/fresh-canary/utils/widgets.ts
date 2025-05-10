// WorkOS Widgets utilities
import { workos } from "./workos.ts";

// Widget types supported by WorkOS
export enum WidgetType {
  USERS_TABLE = "users-table",
  AUTH_FLOW = "auth-flow",
  PROFILE_EDITOR = "profile-editor",
  ORG_SWITCHER = "org-switcher"
}

// Widget themes
export enum WidgetTheme {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system"
}

// Options for generating a widget token
export interface GenerateWidgetTokenOptions {
  organizationId: string;
  userId: string;
  widgetType: WidgetType;
}

// Widget customization options
export interface WidgetCustomization {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

// Generate a token for a WorkOS widget
export async function generateWidgetToken(options: GenerateWidgetTokenOptions): Promise<string> {
  try {
    const token = await workos.widgets.getToken({
      organizationId: options.organizationId,
      userId: options.userId,
      scopes: [`widgets:${options.widgetType}:manage`]
    });

    return token;
  } catch (error) {
    console.error("Error generating widget token:", error);
    throw error;
  }
}