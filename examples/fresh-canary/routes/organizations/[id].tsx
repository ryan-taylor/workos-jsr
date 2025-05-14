import { Head } from "$fresh/runtime.ts";
import type { Handlers, PageProps } from "$fresh/server.ts";
import { workos } from "../../utils/workos.ts";
import OrganizationDetail from "../../islands/OrganizationDetail.tsx";

interface OrganizationDetailPageData {
  id: string;
}

export const handler: Handlers<OrganizationDetailPageData> = {
  async GET(req, ctx) {
    const { id } = ctx.params;

    try {
      // Verify the organization exists
      await workos.organizations.getOrganization(id);

      return ctx.render({ id });
    } catch (error) {
      console.error(`Organization not found: ${id}`, error);
      // Redirect to organizations list if not found
      return new Response("", {
        status: 302,
        headers: {
          Location: "/organizations",
        },
      });
    }
  },
};

export default function OrganizationDetailPage(
  { data }: PageProps<OrganizationDetailPageData>,
) {
  return (
    <>
      <Head>
        <title>Organization Details - WorkOS Demo</title>
      </Head>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <OrganizationDetail id={data.id} />
      </div>
    </>
  );
}
