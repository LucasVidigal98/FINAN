package br.com.finan.dashboard;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlySummaryResponse> monthly(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.monthly(year, month));
    }

    @GetMapping("/expense-distribution")
    public ResponseEntity<ExpenseDistributionResponse> expenseDistribution(@RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(service.expenseDistribution(year, month));
    }

    @GetMapping("/largest-expenses")
    public ResponseEntity<LargestExpensesResponse> largestExpenses(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.largestExpenses(year, month));
    }

    @GetMapping("/comparison")
    public ResponseEntity<DashboardComparisonResponse> comparison(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.comparison(year, month));
    }

    @GetMapping("/evolution")
    public ResponseEntity<DashboardEvolutionResponse> evolution(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.evolution(year, month));
    }
}
