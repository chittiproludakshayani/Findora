package com.findora.users;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "items", indexes = {
        @Index(name = "idx_items_type_status", columnList = "type,status"),
        @Index(name = "idx_items_owner", columnList = "owner_id")
})
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ItemType type;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 60)
    private String category;
    @Column(nullable = false, length = 180)
    private String location;
    @Column(nullable = false)
    private LocalDate eventDate;
    @Column(nullable = false, length = 2000)
    private String details;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageData;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private ItemStatus status = ItemStatus.PUBLISHED;
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public ItemType getType() { return type; }
    public void setType(ItemType type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name.trim(); }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category.trim(); }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location.trim(); }
    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details.trim(); }
    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }
    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
}
