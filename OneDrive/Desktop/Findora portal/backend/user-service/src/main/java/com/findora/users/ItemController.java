package com.findora.users;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ItemController {
    private final ItemRepository items;
    private final UserRepository users;
    private final ClaimRepository claims;
    private final MatchRepository matches;
    private final NotificationRepository notifications;
    private final MatchingService matchingService;
    private final HandoverRepository handovers;
    private final MessageRepository messages;
    private final ItemResponseRepository itemResponses;

    public ItemController(ItemRepository items, UserRepository users, ClaimRepository claims, MatchRepository matches,
                          NotificationRepository notifications, MatchingService matchingService,
                          HandoverRepository handovers, MessageRepository messages, ItemResponseRepository itemResponses) {
        this.items = items;
        this.users = users;
        this.claims = claims;
        this.matches = matches;
        this.notifications = notifications;
        this.matchingService = matchingService;
        this.handovers = handovers;
        this.messages = messages;
        this.itemResponses = itemResponses;
    }

    @GetMapping("/items")
    public List<ItemSummary> browse(@RequestParam(required = false) ItemType type,
                                    @RequestParam(required = false) String category,
                                    @RequestParam(required = false) String location,
                                    Authentication authentication) {
        List<Item> result = type == null
                ? items.findByStatusOrderByCreatedAtDesc(ItemStatus.PUBLISHED)
                : items.findByStatusAndTypeOrderByCreatedAtDesc(ItemStatus.PUBLISHED, type);
        return result.stream()
                .filter(item -> category == null || category.isBlank() || item.getCategory().equalsIgnoreCase(category))
                .filter(item -> location == null || location.isBlank() || item.getLocation().toLowerCase().contains(location.toLowerCase()))
                .map(ItemSummary::from)
                .toList();
    }

    @GetMapping("/items/mine")
    public List<ItemSummary> mine(Authentication authentication) {
        User user = currentUser(authentication);
        return items.findByOwnerOrderByCreatedAtDesc(user).stream().map(ItemSummary::fromPrivate).toList();
    }

    @GetMapping("/items/{id}")
    public ItemSummary details(@PathVariable Long id, Authentication authentication) {
        return ItemSummary.from(items.findById(id).orElseThrow(() -> notFound("Item not found")));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemSummary create(@Valid @RequestBody CreateItemRequest request, Authentication authentication) {
        Item item = new Item();
        item.setOwner(currentUser(authentication));
        item.setType(request.type());
        item.setName(request.name());
        item.setCategory(request.category());
        item.setLocation(request.location());
        item.setEventDate(request.date());
        item.setDetails(request.details());
        item.setImageData(request.imageData());
        Item saved = items.save(item);
        matchingService.matchFoundItem(saved);
        return ItemSummary.fromPrivate(saved);
    }

    @PostMapping("/items/{id}/claims")
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimSummary claim(@PathVariable Long id, @Valid @RequestBody CreateClaimRequest request,
                              Authentication authentication) {
        User claimant = currentUser(authentication);
        Item item = items.findById(id).orElseThrow(() -> notFound("Item not found"));
        if (item.getType() != ItemType.FOUND || item.getOwner().getId().equals(claimant.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only another user can claim a found item");
        }
        if (claims.existsByItemAndClaimant(item, claimant)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already submitted a claim for this item");
        }
        Claim claim = new Claim();
        claim.setItem(item);
        claim.setClaimant(claimant);
        matches.findByLostItemOwnerOrderByScoreDesc(claimant).stream()
                .filter(match -> match.getFoundItem().getId().equals(item.getId()))
                .findFirst()
                .ifPresent(match -> claim.setMatch(match));
        claim.setReason(request.reason());
        claim.setIdentifyingInformation(request.identifyingInformation());
        claim.setProofOfOwnership(request.proofOfOwnership());
        return ClaimSummary.from(claims.save(claim));
    }

    @GetMapping("/claims/mine")
    public List<ClaimSummary> myClaims(Authentication authentication) {
        return claims.findByClaimantOrderByCreatedAtDesc(currentUser(authentication)).stream().map(ClaimSummary::from).toList();
    }

    @GetMapping("/claims/incoming")
    public List<ClaimSummary> incomingClaims(Authentication authentication) {
        return claims.findByItemOwnerOrderByCreatedAtDesc(currentUser(authentication)).stream().map(ClaimSummary::from).toList();
    }

    @PostMapping("/items/{id}/responses")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponseSummary respondToLostItem(@PathVariable Long id,
                                                 @Valid @RequestBody ItemResponseRequest request,
                                                 Authentication authentication) {
        User sender = currentUser(authentication);
        Item item = items.findById(id).orElseThrow(() -> notFound("Item not found"));
        if (item.getType() != ItemType.LOST || item.getOwner().getId().equals(sender.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responses are only for another user's lost item");
        }
        ItemResponse response = new ItemResponse();
        response.setItem(item);
        response.setSender(sender);
        response.setMessage(request.message());
        return ItemResponseSummary.from(itemResponses.save(response));
    }

    @GetMapping("/responses/mine")
    public List<ItemResponseSummary> responsesForMyItems(Authentication authentication) {
        return itemResponses.findByItemOwnerOrderByCreatedAtDesc(currentUser(authentication)).stream()
                .map(ItemResponseSummary::from).toList();
    }

    @PutMapping("/claims/{id}/status")
    public ClaimSummary updateClaim(@PathVariable Long id, @Valid @RequestBody ClaimStatusRequest request,
                                    Authentication authentication) {
        Claim claim = claimById(id);
        User finder = currentUser(authentication);
        if (!claim.getItem().getOwner().getId().equals(finder.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the finder can verify this claim");
        }
        if (request.status() != ClaimStatus.APPROVED && request.status() != ClaimStatus.REJECTED
                && request.status() != ClaimStatus.UNDER_VERIFICATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported claim transition");
        }
        claim.setStatus(request.status());
        if (request.status() == ClaimStatus.APPROVED) claim.getItem().setStatus(ItemStatus.CLAIMED);
        return ClaimSummary.from(claims.save(claim));
    }

    @PutMapping("/claims/{id}/proof")
    public ClaimSummary submitProof(@PathVariable Long id, @Valid @RequestBody ProofRequest request,
                                    Authentication authentication) {
        Claim claim = claimById(id);
        if (!claim.getClaimant().getId().equals(currentUser(authentication).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the claimant can submit proof");
        }
        if (claim.getStatus() != ClaimStatus.UNDER_VERIFICATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The finder has not requested additional proof");
        }
        claim.setProofOfOwnership(request.proofOfOwnership());
        claim.setStatus(ClaimStatus.PENDING);
        return ClaimSummary.from(claims.save(claim));
    }

    @PostMapping("/claims/{id}/handover")
    @ResponseStatus(HttpStatus.CREATED)
    public HandoverResponse createHandover(@PathVariable Long id, Authentication authentication) {
        Claim claim = claimById(id);
        User user = currentUser(authentication);
        assertParticipant(claim, user);
        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim must be approved before handover");
        }
        Handover existing = handovers.findByClaim(claim).orElse(null);
        if (existing != null) return HandoverResponse.from(existing, null);
        String code = UUID.randomUUID().toString().replace("-", "");
        Handover handover = new Handover();
        handover.setClaim(claim);
        handover.setTokenHash(hash(code));
        return HandoverResponse.from(handovers.save(handover), code);
    }

    @PostMapping("/handovers/{id}/confirm")
    public HandoverResponse confirmHandover(@PathVariable Long id, @Valid @RequestBody HandoverConfirmation request,
                                            Authentication authentication) {
        Handover handover = handovers.findById(id).orElseThrow(() -> notFound("Handover not found"));
        User user = currentUser(authentication);
        assertParticipant(handover.getClaim(), user);
        if (!MessageDigest.isEqual(hash(request.code()).getBytes(StandardCharsets.UTF_8),
                handover.getTokenHash().getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid handover code");
        }
        boolean finder = handover.getClaim().getItem().getOwner().getId().equals(user.getId());
        if (finder) handover.setFinderConfirmed(true); else handover.setClaimantConfirmed(true);
        if (handover.isFinderConfirmed() && handover.isClaimantConfirmed()) {
            handover.setCompletedAt(Instant.now());
            handover.getClaim().setStatus(ClaimStatus.RETURNED);
            handover.getClaim().getItem().setStatus(ItemStatus.RETURNED);
            claims.save(handover.getClaim());
        }
        return HandoverResponse.from(handovers.save(handover), null);
    }

    @GetMapping("/claims/{id}/messages")
    public List<MessageSummary> getMessages(@PathVariable Long id, Authentication authentication) {
        Claim claim = claimById(id);
        assertParticipant(claim, currentUser(authentication));
        return messages.findByClaimOrderByCreatedAtAsc(claim).stream().map(MessageSummary::from).toList();
    }

    @PostMapping("/claims/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageSummary sendMessage(@PathVariable Long id, @Valid @RequestBody MessageRequest request,
                                      Authentication authentication) {
        Claim claim = claimById(id);
        User sender = currentUser(authentication);
        assertParticipant(claim, sender);
        if (claim.getStatus() != ClaimStatus.APPROVED && claim.getStatus() != ClaimStatus.RETURNED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Messaging opens after claim approval");
        }
        Message message = new Message();
        message.setClaim(claim);
        message.setSender(sender);
        message.setContent(request.content());
        return MessageSummary.from(messages.save(message));
    }

    @GetMapping("/matches/mine")
    public List<MatchSummary> matches(Authentication authentication) {
        return matches.findByLostItemOwnerOrderByScoreDesc(currentUser(authentication)).stream()
                .map(MatchSummary::from).toList();
    }

    @GetMapping("/notifications/mine")
    public NotificationResponse notifications(Authentication authentication) {
        User user = currentUser(authentication);
        return new NotificationResponse(notifications.countByRecipientAndReadFalse(user),
                notifications.findByRecipientOrderByCreatedAtDesc(user).stream().map(NotificationSummary::from).toList());
    }

    @PostMapping("/notifications/read")
    public void markNotificationsRead(Authentication authentication) {
        notifications.findByRecipientOrderByCreatedAtDesc(currentUser(authentication)).forEach(notification -> notification.setRead(true));
        notifications.saveAll(notifications.findByRecipientOrderByCreatedAtDesc(currentUser(authentication)));
    }

    private User currentUser(Authentication authentication) {
        return users.findByEmail(authentication.getName()).orElseThrow(() -> notFound("User not found"));
    }

    private Claim claimById(Long id) {
        return claims.findById(id).orElseThrow(() -> notFound("Claim not found"));
    }

    private void assertParticipant(Claim claim, User user) {
        boolean finder = claim.getItem().getOwner().getId().equals(user.getId());
        boolean claimant = claim.getClaimant().getId().equals(user.getId());
        if (!finder && !claimant) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not part of this claim");
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte part : digest) result.append(String.format("%02x", part));
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    public record CreateItemRequest(@NotNull ItemType type, @NotBlank @Size(max = 120) String name,
                                    @NotBlank @Size(max = 60) String category, @NotBlank @Size(max = 180) String location,
                                    @NotNull LocalDate date, @NotBlank @Size(max = 2000) String details,
                                    @Size(max = 4_000_000) String imageData) {}

    public record CreateClaimRequest(@NotBlank @Size(max = 2000) String reason,
                                     @NotBlank @Size(max = 2000) String identifyingInformation,
                                     @Size(max = 4000) String proofOfOwnership) {}
    public record ClaimStatusRequest(@NotNull ClaimStatus status) {}
    public record ProofRequest(@NotBlank @Size(max = 4000) String proofOfOwnership) {}
    public record HandoverConfirmation(@NotBlank String code) {}
    public record MessageRequest(@NotBlank @Size(max = 2000) String content) {}
    public record ItemResponseRequest(@NotBlank @Size(max = 2000) String message) {}

    public record MatchSummary(Long id, Long lostItemId, Long foundItemId, ItemSummary lostItem,
                               ItemSummary foundItem, BigDecimal score, String signals, Instant createdAt) {
        static MatchSummary from(Match match) {
            return new MatchSummary(match.getId(), match.getLostItem().getId(), match.getFoundItem().getId(),
                    ItemSummary.from(match.getLostItem()), ItemSummary.from(match.getFoundItem()),
                    match.getScore(), match.getSignals(), match.getCreatedAt());
        }
    }

    public record NotificationSummary(Long id, String message, Long matchId, boolean read, Instant createdAt) {
        static NotificationSummary from(Notification notification) {
            return new NotificationSummary(notification.getId(), notification.getMessage(),
                    notification.getMatch().getId(), notification.isRead(), notification.getCreatedAt());
        }
    }

    public record NotificationResponse(long unreadCount, List<NotificationSummary> notifications) {}

    public record HandoverResponse(Long id, boolean finderConfirmed, boolean claimantConfirmed,
                                   Instant completedAt, String code) {
        static HandoverResponse from(Handover handover, String code) {
            return new HandoverResponse(handover.getId(), handover.isFinderConfirmed(),
                    handover.isClaimantConfirmed(), handover.getCompletedAt(), code);
        }
    }

    public record MessageSummary(Long id, String senderName, String content, Instant createdAt) {
        static MessageSummary from(Message message) {
            return new MessageSummary(message.getId(), message.getSender().getName(),
                    message.getContent(), message.getCreatedAt());
        }

    }

    public record ItemResponseSummary(Long id, Long itemId, String itemName, String senderName,
                                      String message, Instant createdAt) {
        static ItemResponseSummary from(ItemResponse response) {
            return new ItemResponseSummary(response.getId(), response.getItem().getId(),
                    response.getItem().getName(), response.getSender().getName(),
                    response.getMessage(), response.getCreatedAt());
        }
    }

    public record ItemSummary(Long id, ItemType type, String name, String category, String location,
                              LocalDate date, ItemStatus status, String imageData, Instant createdAt) {
        static ItemSummary from(Item item) {
            return new ItemSummary(item.getId(), item.getType(), item.getName(), item.getCategory(),
                    item.getLocation(), item.getEventDate(), item.getStatus(), item.getImageData(), item.getCreatedAt());
        }
        static ItemSummary fromPrivate(Item item) { return from(item); }
    }

    public record ClaimSummary(Long id, Long itemId, String itemName, String status, String reason,
                               String identifyingInformation, String proofOfOwnership, Instant createdAt) {
        static ClaimSummary from(Claim claim) {
            return new ClaimSummary(claim.getId(), claim.getItem().getId(), claim.getItem().getName(),
                    claim.getStatus().name(), claim.getReason(), claim.getIdentifyingInformation(),
                    claim.getProofOfOwnership(), claim.getCreatedAt());
        }
    }
}
