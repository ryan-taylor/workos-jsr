import { WorkOS } from "../workos.ts";
import { crypto } from "@std/crypto";
import { assertEquals, assertRejects } from "@std/assert";
import { spy } from "jsr:@std/testing@^1/mock";
import mockWebhook from "./fixtures/webhook.json" with { type: "json" };
import { SignatureVerificationException } from "../../packages/workos_sdk/src/common/exceptions/signature-verification.exception.ts";

// Define interfaces for webhook payload based on the structure in webhook.json
interface WebhookRawAttributes {
  name: {
    givenName: string;
    familyName: string;
    middleName: string;
    honorificPrefix: string;
  };
  title: string;
  active: boolean;
  emails: Array<{
    type: string;
    value: string;
    primary: boolean;
  }>;
  groups: unknown[];
  locale: string;
  schemas: string[];
  userName: string;
  addresses: Array<{
    region: string;
    primary: boolean;
    locality: string;
    postalCode: string;
  }>;
  externalId: string;
  displayName: string;
  "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
    manager: {
      value: string;
      displayName: string;
    };
    division: string;
    department: string;
  };
}

interface WebhookData {
  id: string;
  state: string;
  emails: Array<{
    type: string;
    value: string;
    primary: boolean;
  }>;
  idp_id: string;
  object: string;
  username: string;
  last_name: string;
  first_name: string;
  job_title: string;
  directory_id: string;
  created_at: string;
  updated_at: string;
  raw_attributes: WebhookRawAttributes;
}

interface WebhookPayload {
  id: string;
  data: WebhookData;
  event: string;
  created_at: string;
}

const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
// Options interface for webhooks.constructEvent parameter
interface ConstructEventOptions {
  payload: WebhookPayload | string;
  sigHeader: string;
  secret: string;
  tolerance?: number;
}

// Options interface for webhooks.verifyHeader parameter
interface VerifyHeaderOptions {
  payload: WebhookPayload | string;
  sigHeader: string;
  secret: string;
  tolerance?: number;
}

let payload: WebhookPayload;
let secret: string;
let timestamp: number;
let unhashedString: string;
let signatureHash: string;
let expectation: Record<string, unknown>;

async function setup() {
  payload = mockWebhook;
  secret = "secret";
  timestamp = Date.now() * 1000;
  unhashedString = `${timestamp}.${JSON.stringify(payload)}`;
  // Deno crypto uses Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "hmac",
    key,
    encoder.encode(unhashedString),
  );

  // Convert to hex
  signatureHash = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  expectation = {
    id: "directory_user_01FAEAJCR3ZBZ30D8BD1924TVG",
    state: "active",
    emails: [
      {
        type: "work",
        value: "blair@foo-corp.com",
        primary: true,
      },
    ],
    idpId: "00u1e8mutl6wlH3lL4x7",
    object: "directory_user",
    username: "blair@foo-corp.com",
    lastName: "Lunchford",
    firstName: "Blair",
    jobTitle: "Software Engineer",
    directoryId: "directory_01F9M7F68PZP8QXP8G7X5QRHS7",
    createdAt: "2021-06-25T19:07:33.155Z",
    updatedAt: "2021-06-25T19:07:33.155Z",
    rawAttributes: {
      name: {
        givenName: "Blair",
        familyName: "Lunchford",
        middleName: "Elizabeth",
        honorificPrefix: "Ms.",
      },
      title: "Software Engineer",
      active: true,
      emails: [
        {
          type: "work",
          value: "blair@foo-corp.com",
          primary: true,
        },
      ],
      groups: [],
      locale: "en-US",
      schemas: [
        "urn:ietf:params:scim:schemas:core:2.0:User",
        "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
      ],
      userName: "blair@foo-corp.com",
      addresses: [
        {
          region: "CA",
          primary: true,
          locality: "San Francisco",
          postalCode: "94016",
        },
      ],
      externalId: "00u1e8mutl6wlH3lL4x7",
      displayName: "Blair Lunchford",
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
        manager: {
          value: "2",
          displayName: "Kate Chapman",
        },
        division: "Engineering",
        department: "Customer Success",
      },
    },
  };
}

Deno.test("webhooks.constructEvent with correct payload, sig_header, and secret", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  const options: ConstructEventOptions = { payload, sigHeader, secret };
  // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
  const webhook = await workos.webhooks.constructEvent(options);

  assertEquals(webhook.data, expectation);
  assertEquals(webhook.event, "dsync.user.created");
  assertEquals(webhook.id, "wh_123");
});

Deno.test("webhooks.constructEvent with correct payload, sig_header, secret, and tolerance", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  const options: ConstructEventOptions = {
    payload,
    sigHeader,
    secret,
    tolerance: 200,
  };
  // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
  const webhook = await workos.webhooks.constructEvent(options);

  assertEquals(webhook.data, expectation);
  assertEquals(webhook.event, "dsync.user.created");
  assertEquals(webhook.id, "wh_123");
});

Deno.test("webhooks.constructEvent with empty header throws error", async () => {
  await setup();
  const sigHeader = "";
  const options: ConstructEventOptions = { payload, sigHeader, secret };

  await assertRejects(
    // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with empty signature hash throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=`;
  const options: ConstructEventOptions = { payload, sigHeader, secret };

  await assertRejects(
    // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with incorrect signature hash throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=99999`;
  const options: ConstructEventOptions = { payload, sigHeader, secret };

  await assertRejects(
    // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with incorrect payload throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  // deno-lint-ignore no-explicit-any
  // This is a legitimate use of 'any' for a negative test case - we're deliberately
  // providing an invalid payload type to test error handling
  payload = "invalid" as any;
  const options: ConstructEventOptions = { payload, sigHeader, secret };

  await assertRejects(
    // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with incorrect webhook secret throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  secret = "invalid";
  const options: ConstructEventOptions = { payload, sigHeader, secret };

  await assertRejects(
    // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with timestamp outside tolerance throws error", async () => {
  await setup();
  const sigHeader = `t=9999, v1=${signatureHash}`;
  const options: ConstructEventOptions = { payload, sigHeader, secret };

  await assertRejects(
    // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.verifyHeader aliases to the signature provider", async () => {
  await setup();
  // deno-lint-ignore no-explicit-any
  // This is a legitimate use of 'any' - we need to access the private signatureProvider
  // property for test verification purposes using bracket notation
  const verifyHeaderSpy = spy(
    (workos.webhooks as any)["signatureProvider"],
    "verifyHeader",
  );

  // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
  await workos.webhooks.verifyHeader({
    payload,
    sigHeader: `t=${timestamp}, v1=${signatureHash}`,
    secret,
  });

  assertEquals(verifyHeaderSpy.calls.length, 1);
});

Deno.test("webhooks.computeSignature aliases to the signature provider", async () => {
  await setup();
  // deno-lint-ignore no-explicit-any
  // This is a legitimate use of 'any' - we need to access the private signatureProvider
  // property for test verification purposes using bracket notation
  const computeSignatureSpy = spy(
    (workos.webhooks as any)["signatureProvider"],
    "computeSignature",
  );

  // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
  await workos.webhooks.computeSignature(timestamp, payload, secret);

  assertEquals(computeSignatureSpy.calls.length, 1);
});

Deno.test("webhooks.getTimestampAndSignatureHash aliases to the signature provider", async () => {
  await setup();
  // deno-lint-ignore no-explicit-any
  // This is a legitimate use of 'any' - we need to access the private signatureProvider
  // property for test verification purposes using bracket notation
  const getTimestampAndSignatureHashSpy = spy(
    (workos.webhooks as any)["signatureProvider"],
    "getTimestampAndSignatureHash",
  );

  // @ts-expect-error The WorkOS instance has a dynamic structure where webhooks has these methods
  workos.webhooks.getTimestampAndSignatureHash(
    `t=${timestamp}, v1=${signatureHash}`,
  );

  assertEquals(getTimestampAndSignatureHashSpy.calls.length, 1);
});
