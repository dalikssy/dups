// An error whose message is safe to show to the person using the hub.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
