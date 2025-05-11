import type { UnknownRecord } from "../../common/interfaces/unknown-record.interface.ts";
import type {
  ProfileAndToken,
  ProfileAndTokenResponse,
} from "../interfaces.ts";
import { deserializeProfile } from "./profile.serializer.ts";

export const deserializeProfileAndToken = <
  CustomAttributesType extends UnknownRecord,
>(
  profileAndToken: ProfileAndTokenResponse<CustomAttributesType>,
): ProfileAndToken<CustomAttributesType> => ({
  accessToken: profileAndToken.access_token,
  profile: deserializeProfile(profileAndToken.profile),
});
