import type { WorkOS } from "@ryantaylor/workos";
import type { GeneratePortalLinkIntent } from "$sdk/portal/interfaces/generate-portal-link-intent.interface";

export class Portal {
  constructor(private readonly workos: WorkOS) {}

  generateLink({
    intent,
    organization,
    returnUrl,
    successUrl,
  }: {
    intent: GeneratePortalLinkIntent;
    organization: string;
    returnUrl?: string;
    successUrl?: string;
  }): Promise<{ link: string }> {
    return this.workos.post<{ link: string }>("/portal/generate_link", {
      intent,
      organization,
      return_url: returnUrl,
      success_url: successUrl,
    }).then(({ data }) => data);
  }
}
