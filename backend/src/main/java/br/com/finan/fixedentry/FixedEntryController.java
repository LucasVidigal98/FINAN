package br.com.finan.fixedentry;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fixed-entries")
@CrossOrigin(origins = "http://localhost:4200")
public class FixedEntryController {

    private final FixedEntryService service;

    public FixedEntryController(FixedEntryService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FixedEntryResponse create(@Valid @RequestBody CreateFixedEntryRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<FixedEntryResponse> list() {
        return service.list();
    }

    @PatchMapping("/{id}/active")
    public FixedEntryResponse updateActive(@PathVariable UUID id,
            @Valid @RequestBody UpdateFixedEntryActiveRequest request) {
        return service.updateActive(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
