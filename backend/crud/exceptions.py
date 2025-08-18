"""
CRUD-specific exceptions
Custom exceptions for database operations
"""


class CRUDException(Exception):
    """Base exception for CRUD operations"""
    pass


class RecordNotFoundError(CRUDException):
    """Raised when a record is not found"""
    
    def __init__(self, model_name: str, identifier: str):
        self.model_name = model_name
        self.identifier = identifier
        super().__init__(f"{model_name} with identifier '{identifier}' not found")


class DuplicateRecordError(CRUDException):
    """Raised when trying to create a duplicate record"""
    
    def __init__(self, model_name: str, field: str, value: str):
        self.model_name = model_name
        self.field = field
        self.value = value
        super().__init__(f"{model_name} with {field} '{value}' already exists")


class ValidationError(CRUDException):
    """Raised when validation fails"""
    
    def __init__(self, message: str, field: str = None):
        self.field = field
        super().__init__(message)


class PermissionError(CRUDException):
    """Raised when user doesn't have permission for operation"""
    
    def __init__(self, operation: str, resource: str):
        self.operation = operation
        self.resource = resource
        super().__init__(f"Permission denied for {operation} on {resource}")


class AuthenticationError(CRUDException):
    """Raised when authentication fails"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message)
