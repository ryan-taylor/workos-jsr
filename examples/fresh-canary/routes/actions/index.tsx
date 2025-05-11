import type { PageProps } from '$fresh/server.ts';
import ActionsWorkflowDemo from '../../islands/ActionsWorkflowDemo.tsx';

export default function ActionsPage({ data }: PageProps) {
  // For the demo we'll pass empty initial data and let the client-side load it
  const initialActions = [];
  const totalCount = 0;

  return (
    <div class='container mx-auto px-4 py-8'>
      <h1 class='text-3xl font-bold mb-2'>WorkOS Actions Approval Flow</h1>
      <p class='text-lg text-gray-700 mb-6'>
        This demo showcases how WorkOS's Actions approval flow enables applications to implement approval-based workflows securely and efficiently.
      </p>

      <div class='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
        <div class='bg-white rounded-lg shadow-md p-6'>
          <h2 class='text-xl font-semibold mb-3'>Access Requests</h2>
          <p class='text-gray-600'>
            Implement secure access request workflows where users can request access to resources and administrators can approve or deny these
            requests.
          </p>
        </div>

        <div class='bg-white rounded-lg shadow-md p-6'>
          <h2 class='text-xl font-semibold mb-3'>Configuration Changes</h2>
          <p class='text-gray-600'>
            Ensure critical configuration changes go through an approval process before being implemented, reducing the risk of accidental or
            malicious changes.
          </p>
        </div>

        <div class='bg-white rounded-lg shadow-md p-6'>
          <h2 class='text-xl font-semibold mb-3'>Sensitive Operations</h2>
          <p class='text-gray-600'>
            Add an extra layer of security for sensitive operations like bulk data deletions, financial transactions, or system-wide changes.
          </p>
        </div>
      </div>

      <div class='bg-gray-50 p-6 rounded-lg shadow mb-12'>
        <h2 class='text-2xl font-bold mb-4'>How It Works</h2>
        <ol class='list-decimal list-inside space-y-3 text-gray-700'>
          <li>An action is initiated (e.g., a user requests access or a configuration change)</li>
          <li>The action is captured and stored with a "pending" status</li>
          <li>Approvers are notified of the pending action</li>
          <li>Approvers review the action and make a decision (approve or reject)</li>
          <li>The action's status is updated based on the decision</li>
          <li>The system executes the appropriate response (e.g., granting access or making the configuration change)</li>
        </ol>
      </div>

      <div class='bg-gray-50 p-6 rounded-lg shadow mb-12'>
        <h2 class='text-2xl font-bold mb-4'>Implementation Example</h2>
        <div class='bg-gray-800 text-white p-4 rounded-md overflow-auto text-sm'>
          <pre>
{`// Initialize the WorkOS client
const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Create an Actions client
const actions = workos.actions(new CryptoProvider());

// When an action webhook is received
app.post('/webhooks/actions', async (req, res) => {
  try {
    // Verify the signature in the WorkOS-Signature header
    const sigHeader = req.headers['workos-signature'];

    // Construct the action context
    const actionContext = await actions.constructAction({
      payload: req.body,
      sigHeader,
      secret: process.env.WORKOS_WEBHOOK_SECRET
    });

    // Process the action based on the context
    if (actionContext.object === 'authentication_action_context') {
      // Handle authentication action
      // ...

      // Respond to WorkOS with approval or denial
      const response = await actions.signResponse(
        { type: 'authentication', verdict: 'Allow' },
        process.env.WORKOS_WEBHOOK_SECRET
      );

      // Return the signed response
      return res.json(response);
    }
  } catch (error) {
    console.error('Error processing action:', error);
    return res.status(400).json({ error: error.message });
  }
});`}
          </pre>
        </div>
      </div>

      <div class='mt-10'>
        <h2 class='text-2xl font-bold mb-6'>Actions Demo</h2>
        <ActionsWorkflowDemo
          initialActions={initialActions}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
