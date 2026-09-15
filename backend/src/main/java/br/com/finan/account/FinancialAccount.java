package br.com.finan.account;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import br.com.finan.transaction.TransactionSource;
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
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "financial_accounts")
public class FinancialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Size(max = 80)
    @Column(nullable = false, length = 80)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionSource source = TransactionSource.MANUAL;

    @Column(name = "initial_balance", columnDefinition = "numeric")
    private BigDecimal initialBalance;

    @Column(name = "provider_balance", columnDefinition = "numeric")
    private BigDecimal providerBalance;

    @Column(name = "external_id")
    private String externalId;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FinancialAccount() {
    }

    public FinancialAccount(String name, AccountType type, BigDecimal initialBalance) {
        this.name = name;
        this.type = type;
        this.initialBalance = initialBalance;
    }

    @PrePersist
    private void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public AccountType getType() { return type; }
    public TransactionSource getSource() { return source; }
    public BigDecimal getInitialBalance() { return initialBalance; }
    public BigDecimal getProviderBalance() { return providerBalance; }
    public String getExternalId() { return externalId; }
    public boolean isActive() { return active; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
