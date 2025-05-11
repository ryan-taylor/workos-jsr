import { deserializeFactor } from "./serializers/factor.serializer.ts";
import { deserializeChallenge } from "./serializers/challenge.serializer.ts";
import type {
  Challenge,
  ChallengeFactorOptions,
  EnrollFactorOptions,
  Factor,
  VerifyChallengeOptions,
} from "./interfaces/index.ts";
import type { WorkOS } from "../workos.ts";

class MFAImpl {
  constructor(private workos: WorkOS) {}

  async enrollFactor(options: EnrollFactorOptions): Promise<Factor> {
    const { data } = await this.workos.post<Factor>(
      "/auth/factors/enroll",
      options,
    );
    return data;
  }

  async challengeFactor(options: ChallengeFactorOptions): Promise<Challenge> {
    const { data } = await this.workos.post<Challenge>(
      "/auth/factors/challenge",
      options,
    );
    return data;
  }

  async verifyChallenge(options: VerifyChallengeOptions): Promise<Challenge> {
    const { data } = await this.workos.post<Challenge>(
      "/auth/factors/verify",
      options,
    );
    return data;
  }
}

export { MFAImpl as MFA, MFAImpl as Mfa };
