package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "financial_transactions")
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String description;

    @NotNull
    @Positive
    @Column(nullable = false, columnDefinition = "numeric")
    private BigDecimal amount;

    @NotNull
    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionSource source = TransactionSource.MANUAL;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FinancialTransaction() {
    }

    public FinancialTransaction(String description, BigDecimal amount, LocalDate occurredOn,
            TransactionType type) {
        this.description = description;
        this.amount = amount;
        this.occurredOn = occurredOn;
        this.type = type;
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getOccurredOn() { return occurredOn; }
    public TransactionType getType() { return type; }
    public TransactionSource getSource() { return source; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setDescription(String description) { this.description = description; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setOccurredOn(LocalDate occurredOn) { this.occurredOn = occurredOn; }
    public void setType(TransactionType type) { this.type = type; }
    public void setSource(TransactionSource source) { this.source = source; }
}
