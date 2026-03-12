class ApiError(Exception):
    def __init__(self, message: str, status: int | None = None, code: str | None = None, trace_id: str | None = None, details=None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.trace_id = trace_id
        self.details = details
