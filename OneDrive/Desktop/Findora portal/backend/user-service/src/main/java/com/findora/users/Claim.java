package com.findora.users;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "claims", indexes = {
        @Index(name = "idx_claims_item", columnList = "item_id"),
        @Index(name = "idx_claims_claimant", columnList = "claimant_id")
})
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claimant_id", nullable = false)
    private User claimant;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;
    @Column(nullable = false, length = 2000)
    private String reason;
    @Column(nullable = false, length = 2000)
    private String identifyingInformation;
    @Column(length = 4000)
    private String proofOfOwnership;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClaimStatus status = ClaimStatus.PENDING;
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }
    public User getClaimant() { return claimant; }
    public void setClaimant(User claimant) { this.claimant = claimant; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason.trim(); }
    public String getIdentifyingInformation() { return identifyingInformation; }
    public void setIdentifyingInformation(String identifyingInformation) { this.identifyingInformation = identifyingInformation.trim(); }
    public String getProofOfOwnership() { return proofOfOwnership; }
    public void setProofOfOwnership(String proofOfOwnership) { this.proofOfOwnership = proofOfOwnership == null ? null : proofOfOwnership.trim(); }
    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
}
