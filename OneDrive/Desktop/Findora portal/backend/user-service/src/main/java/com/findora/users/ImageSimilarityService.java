package com.findora.users;

import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ImageSimilarityService {
    /**
     * Image model integration point. No image score is invented until a real
     * feature extractor is configured; matching remains attribute-based.
     */
    public Optional<Double> compare(String firstImage, String secondImage) {
        return Optional.empty();
    }
}
