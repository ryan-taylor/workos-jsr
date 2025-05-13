import { deserializeUser } from "./user.serializer.ts.ts";
import userFixture from "../fixtures/user.json.ts";

describe("deserializeUser", () => {
  it("includes metadata if present", () => {
    const metadata = { key: "value" };

    expect(
      deserializeUser({
        ...userFixture,
        object: "user",
        metadata,
      }),
    ).toMatchObject({
      metadata,
    });
  });

  it("coerces missing metadata to empty object", () => {
    const { metadata, ...userResponseWithoutMetadata } = userFixture;

    expect(
      deserializeUser({ ...userResponseWithoutMetadata, object: "user" }),
    ).toMatchObject({
      metadata: {},
    });
  });
});
