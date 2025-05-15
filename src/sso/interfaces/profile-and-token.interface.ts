import type { UnknownRecord } from "../../common/interfaces/unknown-record.interface.ts";
import type { Profile, ProfileResponse } from "./profile.interface.ts";

export interface ProfileAndToken {
  accessToken: string;
  profile: Profile;
}
export interface ProfileAndTokenResponse {
  access_token: string;
  profile: ProfileResponse;
}
