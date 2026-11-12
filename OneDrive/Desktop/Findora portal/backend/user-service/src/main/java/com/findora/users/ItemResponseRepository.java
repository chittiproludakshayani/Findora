package com.findora.users;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemResponseRepository extends JpaRepository<ItemResponse, Long> {
    List<ItemResponse> findByItemOwnerOrderByCreatedAtDesc(User owner);
}
