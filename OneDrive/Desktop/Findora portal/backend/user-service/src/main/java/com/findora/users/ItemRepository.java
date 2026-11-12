package com.findora.users;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByStatusOrderByCreatedAtDesc(ItemStatus status);
    List<Item> findByOwnerOrderByCreatedAtDesc(User owner);
    List<Item> findByStatusAndTypeOrderByCreatedAtDesc(ItemStatus status, ItemType type);
}
