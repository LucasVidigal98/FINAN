package br.com.finan.shared;

public class ApplicationException extends RuntimeException {

    public enum Type {
        INVALID_REQUEST,
        NOT_FOUND,
        CONFLICT
    }

    private final Type type;

    public ApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public ApplicationException(Type type, String message, Throwable cause) {
        super(message, cause);
        this.type = type;
    }

    public Type getType() {
        return type;
    }
}
