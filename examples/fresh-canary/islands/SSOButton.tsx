/**
 * @fileoverview SSOButton component for integrating WorkOS SSO with Fresh applications
 *
 * This component provides a customizable button for initiating SSO authentication
 * with various identity providers supported by WorkOS.
 */
/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { useWorkOS } from "../hooks/use-workos.ts";

// Supported SSO providers
export type SSOProvider =
  | "google-oauth"
  | "github-oauth"
  | "microsoft-oauth"
  | "okta"
  | "auth0"
  | "onelogin"
  | "azure-saml"
  | "azure-oidc"
  | "jumpcloud"
  | "ping-federate"
  | "ping-one"
  | "generic-saml"
  | "generic-oidc"
  | string; // For custom provider IDs

// Button style options
export type ButtonStyle = "primary" | "secondary" | "outline" | "minimal";
export type ButtonSize = "small" | "medium" | "large";

export interface SSOButtonProps {
  /**
   * The SSO provider to authenticate with.
   * This can be a provider type (e.g., "google-oauth") or a specific provider ID.
   */
  provider: SSOProvider;

  /**
   * Optional display name for the provider.
   * If not provided, a reasonable default will be used based on the provider type.
   */
  providerName?: string;

  /**
   * Optional URL to redirect after successful authentication.
   * If not provided, the default callback URL will be used.
   */
  redirectURI?: string;

  /**
   * Optional button text.
   * If not provided, "Sign in with {providerName}" will be used.
   */
  buttonText?: string;

  /**
   * Optional CSS class to apply to the button.
   */
  className?: string;

  /**
   * Button style variant.
   * @default "primary"
   */
  variant?: ButtonStyle;

  /**
   * Button size.
   * @default "medium"
   */
  size?: ButtonSize;

  /**
   * Optional icon URL to display in the button.
   * If not provided, a default icon may be used based on the provider.
   */
  iconUrl?: string;

  /**
   * Whether to display the provider icon.
   * @default true
   */
  showIcon?: boolean;

  /**
   * Optional handler for when authentication is initiated.
   */
  onAuthInitiated?: () => void;

  /**
   * Optional handler for authentication errors.
   */
  onError?: (error: Error) => void;

  /**
   * Whether the button should take up the full width of its container.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether to disable the button.
   * @default false
   */
  disabled?: boolean;
}

/**
 * Map of provider types to display names
 */
const PROVIDER_NAMES: Record<string, string> = {
  "google-oauth": "Google",
  "github-oauth": "GitHub",
  "microsoft-oauth": "Microsoft",
  "okta": "Okta",
  "auth0": "Auth0",
  "onelogin": "OneLogin",
  "azure-saml": "Azure AD",
  "azure-oidc": "Microsoft",
  "jumpcloud": "JumpCloud",
  "ping-federate": "PingFederate",
  "ping-one": "PingOne",
  "generic-saml": "SAML",
  "generic-oidc": "OIDC",
};

/**
 * SSOButton component for WorkOS SSO authentication
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SSOButton provider="google-oauth" />
 *
 * // Custom styling
 * <SSOButton
 *   provider="okta"
 *   variant="outline"
 *   size="large"
 *   buttonText="Enterprise Login"
 * />
 *
 * // With a specific provider ID
 * <SSOButton provider="sso_abcd1234" />
 * ```
 */
export default function SSOButton({
  provider,
  providerName,
  redirectURI,
  buttonText,
  className = "",
  variant = "primary",
  size = "medium",
  iconUrl,
  showIcon = true,
  onAuthInitiated,
  onError,
  fullWidth = false,
  disabled = false,
}: SSOButtonProps) {
  const { getAuthorizationURL, isLoading, error } = useWorkOS();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Determine the provider display name
  const displayName = providerName ||
    (provider in PROVIDER_NAMES ? PROVIDER_NAMES[provider] : "SSO");

  // Generate button text if not provided
  const displayText = buttonText || `Sign in with ${displayName}`;

  // Build CSS classes for the button
  const sizeClass = {
    small: "py-1 px-3 text-sm",
    medium: "py-2 px-4 text-base",
    large: "py-3 px-6 text-lg",
  }[size];

  const variantClass = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    outline:
      "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50",
    minimal: "bg-transparent text-blue-600 hover:underline hover:bg-blue-50",
  }[variant];

  const widthClass = fullWidth ? "w-full" : "";

  const buttonClasses = `
    flex items-center justify-center gap-2 rounded
    ${sizeClass}
    ${variantClass}
    ${widthClass}
    ${
    disabled || isLoading.value || isAuthenticating
      ? "opacity-70 cursor-not-allowed"
      : ""
  }
    transition-colors duration-200
    ${className}
  `.trim();

  /**
   * Handle button click to initiate SSO authentication
   */
  const handleSignIn = async () => {
    if (disabled || isLoading.value || isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      onAuthInitiated?.();

      const authorizationURL = await getAuthorizationURL(provider, redirectURI);
      globalThis.location.href = authorizationURL;
    } catch (err) {
      console.error("SSO authentication error:", err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      onError?.(errorObj);
      setIsAuthenticating(false);
    }
  };

  // Show error if one was encountered when using the hook
  if (error.value && onError) {
    onError(error.value);
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={disabled || isLoading.value || isAuthenticating}
      class={buttonClasses}
      aria-busy={isLoading.value || isAuthenticating}
    >
      {showIcon && (
        iconUrl
          ? <img src={iconUrl} alt={`${displayName} icon`} class="w-5 h-5" />
          : (
            <span class="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 font-bold text-xs">
              {displayName.charAt(0)}
            </span>
          )
      )}

      <span>
        {isAuthenticating ? "Redirecting..." : displayText}
      </span>
    </button>
  );
}
