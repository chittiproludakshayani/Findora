package com.findora.users;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatchingService {
    private static final double THRESHOLD = 0.35;
    private static final Set<String> COLORS = Set.of("black", "white", "blue", "red", "green", "yellow", "brown", "grey", "gray", "silver", "gold", "pink", "purple");
    private final ItemRepository items;
    private final MatchRepository matches;
    private final NotificationRepository notifications;
    private final ImageSimilarityService imageSimilarity;

    public MatchingService(ItemRepository items, MatchRepository matches, NotificationRepository notifications,
                           ImageSimilarityService imageSimilarity) {
        this.items = items;
        this.matches = matches;
        this.notifications = notifications;
        this.imageSimilarity = imageSimilarity;
    }

    @Transactional
    public void matchFoundItem(Item foundItem) {
        if (foundItem.getType() != ItemType.FOUND) return;
        items.findByStatusAndTypeOrderByCreatedAtDesc(ItemStatus.PUBLISHED, ItemType.LOST).stream()
                .filter(lost -> !lost.getOwner().getId().equals(foundItem.getOwner().getId()))
                .map(lost -> new ScoredMatch(lost, score(lost, foundItem)))
                .filter(candidate -> candidate.score().value() >= THRESHOLD)
                .forEach(candidate -> saveMatch(candidate.lost(), foundItem, candidate.score()));
    }

    private void saveMatch(Item lostItem, Item foundItem, Score score) {
        if (matches.existsByLostItemAndFoundItem(lostItem, foundItem)) return;
        Match match = new Match();
        match.setLostItem(lostItem);
        match.setFoundItem(foundItem);
        match.setScore(BigDecimal.valueOf(score.value() * 100).setScale(2, RoundingMode.HALF_UP));
        match.setSignals(String.join(", ", score.signals()));
        Match saved = matches.save(match);
        if (!notifications.existsByRecipientAndMatch(lostItem.getOwner(), saved)) {
            Notification notification = new Notification();
            notification.setRecipient(lostItem.getOwner());
            notification.setMatch(saved);
            notification.setMessage("Possible match found for your " + lostItem.getName());
            notification.setRead(false);
            notifications.save(notification);
        }
    }

    private Score score(Item lost, Item found) {
        double category = equal(lost.getCategory(), found.getCategory()) ? 1 : 0;
        double name = jaccard(lost.getName(), found.getName());
        double details = jaccard(lost.getDetails(), found.getDetails());
        double location = jaccard(lost.getLocation(), found.getLocation());
        long days = Math.abs(ChronoUnit.DAYS.between(lost.getEventDate(), found.getEventDate()));
        double date = days <= 2 ? 1 : days <= 7 ? .7 : days <= 21 ? .35 : 0;
        double color = colorSimilarity(lost, found);
        List<String> signals = new ArrayList<>();
        if (category > 0) signals.add("category");
        if (name >= .4) signals.add("name");
        if (details >= .25) signals.add("description");
        if (location >= .4) signals.add("location");
        if (date > 0) signals.add("date");
        if (color > 0) signals.add("colour");
        imageSimilarity.compare(lost.getImageData(), found.getImageData()).ifPresent(value -> {
            if (value >= .5) signals.add("image");
        });
        return new Score(category * .25 + name * .30 + details * .20 + location * .10 + date * .10 + color * .05, signals);
    }

    private double colorSimilarity(Item first, Item second) {
        Set<String> firstColors = tokens(first.getName() + " " + first.getDetails()).stream().filter(COLORS::contains).collect(Collectors.toSet());
        Set<String> secondColors = tokens(second.getName() + " " + second.getDetails()).stream().filter(COLORS::contains).collect(Collectors.toSet());
        return !firstColors.isEmpty() && !Collections.disjoint(firstColors, secondColors) ? 1 : 0;
    }

    private double jaccard(String first, String second) {
        Set<String> left = tokens(first);
        Set<String> right = tokens(second);
        if (left.isEmpty() || right.isEmpty()) return 0;
        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);
        Set<String> union = new HashSet<>(left);
        union.addAll(right);
        return (double) intersection.size() / union.size();
    }

    private Set<String> tokens(String value) {
        return Arrays.stream(value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").split("\\s+"))
                .filter(token -> token.length() > 2)
                .collect(Collectors.toSet());
    }

    private boolean equal(String first, String second) {
        return first.equalsIgnoreCase(second);
    }

    private record Score(double value, List<String> signals) {}
    private record ScoredMatch(Item lost, Score score) {}
}
