package com.findora.users;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "item_matches", uniqueConstraints = @UniqueConstraint(
        name = "uk_match_lost_found", columnNames = {"lost_item_id", "found_item_id"}))
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lost_item_id", nullable = false)
    private Item lostItem;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false)
    private Item foundItem;
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;
    @Column(nullable = false, length = 500)
    private String signals;
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Item getLostItem() { return lostItem; }
    public void setLostItem(Item lostItem) { this.lostItem = lostItem; }
    public Item getFoundItem() { return foundItem; }
    public void setFoundItem(Item foundItem) { this.foundItem = foundItem; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public String getSignals() { return signals; }
    public void setSignals(String signals) { this.signals = signals; }
    public Instant getCreatedAt() { return createdAt; }
}
