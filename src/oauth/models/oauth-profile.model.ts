export class OAuthProfile {
  public emails?: Array<{ value: string; verified?: boolean }>;
  public id: string;
  public name?: {
    givenName?: string;
    familyName?: string;
  };
  public photos?: Array<{ value: string }>;
  public provider: string;
}
