import { PageProps } from "$fresh/server.ts";

export default function Home({ data }: PageProps) {
  return (
    <div class="container">
      <h1>WorkOS SSO Example</h1>
      <p>
        This example demonstrates how to implement Single Sign-On (SSO) with WorkOS in a Fresh application.
      </p>
      
      <div class="features">
        <div class="feature">
          <h2>Single Sign-On (SSO)</h2>
          <p>
            Authenticate users with their company's identity provider using WorkOS SSO.
            Supports various providers including Google, Okta, OneLogin, and more.
          </p>
          <a href="/login" class="button">Try SSO Login</a>
        </div>
      </div>
      
      <div class="info">
        <h3>How It Works</h3>
        <ol>
          <li>User clicks the SSO login button</li>
          <li>They are redirected to the WorkOS hosted login page</li>
          <li>After authentication, they are redirected back to your application</li>
          <li>Your application exchanges the code for user profile information</li>
          <li>A session is created and the user is logged in</li>
        </ol>
      </div>
    </div>
  );
}