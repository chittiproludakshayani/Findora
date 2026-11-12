package com.findora.users;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "handovers", uniqueConstraints = @UniqueConstraint(name = "uk_handover_claim", columnNames = "claim_id"))
public class Handover {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;
    @Column(nullable = false, length = 64)
    private String tokenHash;
    @Column(nullable = false)
    private boolean finderConfirmed;
    @Column(nullable = false)
    private boolean claimantConfirmed;
    private Instant completedAt;
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Claim getClaim() { return claim; }
    public void setClaim(Claim claim) { this.claim = claim; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public boolean isFinderConfirmed() { return finderConfirmed; }
    public void setFinderConfirmed(boolean finderConfirmed) { this.finderConfirmed = finderConfirmed; }
    public boolean isClaimantConfirmed() { return claimantConfirmed; }
    public void setClaimantConfirmed(boolean claimantConfirmed) { this.claimantConfirmed = claimantConfirmed; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
