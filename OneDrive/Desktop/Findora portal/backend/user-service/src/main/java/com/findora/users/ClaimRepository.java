package com.findora.users;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByClaimantOrderByCreatedAtDesc(User claimant);
    List<Claim> findByItemOwnerOrderByCreatedAtDesc(User owner);
    boolean existsByItemAndClaimant(Item item, User claimant);
}
