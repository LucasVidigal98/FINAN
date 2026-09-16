package br.com.finan.fixedentry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import br.com.finan.category.Category;
import br.com.finan.transaction.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "fixed_entries")
public class FixedEntry {

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
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @NotNull
    @Column(name = "starts_on", nullable = false)
    private LocalDate startsOn;

    @NotNull
    @Column(name = "eligible_from", nullable = false)
    private LocalDate eligibleFrom;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FixedEntry() {
    }

    public FixedEntry(String description, BigDecimal amount, TransactionType type,
            Category category, LocalDate startsOn, LocalDate eligibleFrom) {
        this.description = description;
        this.amount = amount;
        this.type = type;
        this.category = category;
        this.startsOn = startsOn;
        this.eligibleFrom = eligibleFrom;
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
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public TransactionType getType() { return type; }
    public Category getCategory() { return category; }
    public LocalDate getStartsOn() { return startsOn; }
    public LocalDate getEligibleFrom() { return eligibleFrom; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void activate(LocalDate eligibleFrom) {
        this.active = true;
        this.eligibleFrom = eligibleFrom;
    }

    public void deactivate() {
        this.active = false;
    }
}
