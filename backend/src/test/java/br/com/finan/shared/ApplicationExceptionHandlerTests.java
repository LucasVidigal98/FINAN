package br.com.finan.shared;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationExceptionHandlerTests {

    private final ApplicationExceptionHandler handler = new ApplicationExceptionHandler();

    @Test
    void mapsApplicationFailuresToHttpStatuses() {
        assertThat(statusFor(ApplicationException.Type.INVALID_REQUEST)).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(statusFor(ApplicationException.Type.NOT_FOUND)).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(statusFor(ApplicationException.Type.CONFLICT)).isEqualTo(HttpStatus.CONFLICT);
    }

    private HttpStatus statusFor(ApplicationException.Type type) {
        return (HttpStatus) handler.handle(new ApplicationException(type, "test")).getStatusCode();
    }
}
