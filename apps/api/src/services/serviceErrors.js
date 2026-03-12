export class BackendUnavailableError extends Error {
  constructor(service, backend) {
    super(`${service} backend is unavailable`);
    this.name = 'BackendUnavailableError';
    this.service = service;
    this.backend = backend;
  }
}
