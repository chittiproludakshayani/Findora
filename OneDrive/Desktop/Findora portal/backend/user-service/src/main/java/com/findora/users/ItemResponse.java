package com.findora.users;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "item_responses", indexes = {
        @Index(name = "idx_item_responses_item", columnList = "item_id"),
        @Index(name = "idx_item_responses_sender", columnList = "sender_id")
})
public class ItemResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    @Column(nullable = false, length = 2000)
    private String message;
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message.trim(); }
    public Instant getCreatedAt() { return createdAt; }
}
