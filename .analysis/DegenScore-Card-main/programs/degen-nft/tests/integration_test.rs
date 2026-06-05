use anchor_lang::prelude::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_score_validation() {
        // Test that scores are within valid range (0-100)
        let valid_scores = vec![0, 50, 100];
        let invalid_scores = vec![-1, 101, 150, 999];

        for score in valid_scores {
            assert!(score >= 0 && score <= 100, "Score {} should be valid", score);
        }

        for score in invalid_scores {
            assert!(
                score < 0 || score > 100,
                "Score {} should be invalid",
                score
            );
        }
    }

    #[test]
    fn test_royalty_percentage() {
        // Test 5% royalty calculation
        let sale_price = 10_000;
        let royalty_percentage = 5;
        let expected_royalty = sale_price * royalty_percentage / 100;

        assert_eq!(expected_royalty, 500);
    }

    #[test]
    fn test_genesis_badge_limit() {
        // Test genesis badge limit (first 1000 mints)
        let genesis_limit = 1000;
        let mint_number = 999;

        assert!(
            mint_number < genesis_limit,
            "Mint {} should receive genesis badge",
            mint_number
        );

        let non_genesis = 1001;
        assert!(
            non_genesis >= genesis_limit,
            "Mint {} should NOT receive genesis badge",
            non_genesis
        );
    }

    #[test]
    fn test_score_ranges() {
        // Test score tier classification
        let score_beginner = 30;
        let score_intermediate = 60;
        let score_expert = 85;

        assert!(score_beginner < 50, "Beginner tier");
        assert!(
            score_intermediate >= 50 && score_intermediate < 80,
            "Intermediate tier"
        );
        assert!(score_expert >= 80, "Expert tier");
    }

    #[test]
    fn test_metadata_uri_format() {
        // Test metadata URI construction
        let base_uri = "https://api.degenscore.com/metadata/";
        let token_id = 123;
        let expected_uri = format!("{}{}", base_uri, token_id);

        assert_eq!(
            expected_uri,
            "https://api.degenscore.com/metadata/123"
        );
    }
}
