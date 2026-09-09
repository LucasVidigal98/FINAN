package br.com.finan.account;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:4200")
public class FinancialAccountController {

    private final FinancialAccountService service;

    public FinancialAccountController(FinancialAccountService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FinancialAccountResponse create(@Valid @RequestBody CreateFinancialAccountRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<FinancialAccountResponse> list() {
        return service.list();
    }
}
