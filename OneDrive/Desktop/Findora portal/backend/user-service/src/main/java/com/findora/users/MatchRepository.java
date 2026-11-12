package com.findora.users;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByLostItemOwnerOrderByScoreDesc(User owner);
    boolean existsByLostItemAndFoundItem(Item lostItem, Item foundItem);
}
