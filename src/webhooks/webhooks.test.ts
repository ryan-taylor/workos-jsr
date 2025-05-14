import { WorkOS } from "../workos.ts";
import { crypto } from "@std/crypto";
import { assertEquals, assertRejects } from "@std/assert";
import { spy } from "jsr:@std/testing@^1/mock";
import mockWebhook from "./fixtures/webhook.json.ts" with { type: "json" };
import { SignatureVerificationException } from "../common/exceptions.ts";

const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

let payload: any;
let secret: string;
let timestamp: number;
let unhashedString: string;
let signatureHash: string;
let expectation: object;

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
  const options = { payload, sigHeader, secret };
  const webhook = await workos.webhooks.constructEvent(options);

  assertEquals(webhook.data, expectation);
  assertEquals(webhook.event, "dsync.user.created");
  assertEquals(webhook.id, "wh_123");
});

Deno.test("webhooks.constructEvent with correct payload, sig_header, secret, and tolerance", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  const options = { payload, sigHeader, secret, tolerance: 200 };
  const webhook = await workos.webhooks.constructEvent(options);

  assertEquals(webhook.data, expectation);
  assertEquals(webhook.event, "dsync.user.created");
  assertEquals(webhook.id, "wh_123");
});

Deno.test("webhooks.constructEvent with empty header throws error", async () => {
  await setup();
  const sigHeader = "";
  const options = { payload, sigHeader, secret };

  await assertRejects(
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with empty signature hash throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=`;
  const options = { payload, sigHeader, secret };

  await assertRejects(
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with incorrect signature hash throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=99999`;
  const options = { payload, sigHeader, secret };

  await assertRejects(
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with incorrect payload throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  payload = "invalid";
  const options = { payload, sigHeader, secret };

  await assertRejects(
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with incorrect webhook secret throws error", async () => {
  await setup();
  const sigHeader = `t=${timestamp}, v1=${signatureHash}`;
  secret = "invalid";
  const options = { payload, sigHeader, secret };

  await assertRejects(
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.constructEvent with timestamp outside tolerance throws error", async () => {
  await setup();
  const sigHeader = `t=9999, v1=${signatureHash}`;
  const options = { payload, sigHeader, secret };

  await assertRejects(
    () => workos.webhooks.constructEvent(options),
    SignatureVerificationException,
  );
});

Deno.test("webhooks.verifyHeader aliases to the signature provider", async () => {
  await setup();
  const verifyHeaderSpy = spy(
    workos.webhooks["signatureProvider"],
    "verifyHeader",
  );

  await workos.webhooks.verifyHeader({
    payload,
    sigHeader: `t=${timestamp}, v1=${signatureHash}`,
    secret,
  });

  assertEquals(verifyHeaderSpy.calls.length, 1);
});

Deno.test("webhooks.computeSignature aliases to the signature provider", async () => {
  await setup();
  const computeSignatureSpy = spy(
    workos.webhooks["signatureProvider"],
    "computeSignature",
  );

  await workos.webhooks.computeSignature(timestamp, payload, secret);

  assertEquals(computeSignatureSpy.calls.length, 1);
});

Deno.test("webhooks.getTimestampAndSignatureHash aliases to the signature provider", async () => {
  await setup();
  const getTimestampAndSignatureHashSpy = spy(
    workos.webhooks["signatureProvider"],
    "getTimestampAndSignatureHash",
  );

  workos.webhooks.getTimestampAndSignatureHash(
    `t=${timestamp}, v1=${signatureHash}`,
  );

  assertEquals(getTimestampAndSignatureHashSpy.calls.length, 1);
});
