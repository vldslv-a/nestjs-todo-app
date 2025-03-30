export class SendMailDto {
  public context: Record<string, unknown>;
  public subject: string;
  public template: string;
  public to: string[] | string;
}
