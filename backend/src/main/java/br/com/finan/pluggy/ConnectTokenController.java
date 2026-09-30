package br.com.finan.pluggy;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/open-finance")
@CrossOrigin(origins = "http://localhost:4200")
public class ConnectTokenController {

    private final PluggyClient client;

    public ConnectTokenController(PluggyClient client) {
        this.client = client;
    }

    @PostMapping("/connect-token")
    public ResponseEntity<ConnectTokenResponse> create() {
        try {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                    .body(new ConnectTokenResponse(client.createConnectToken()));
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Pluggy unavailable");
        }
    }

    public record ConnectTokenResponse(String connectToken) {
    }
}
