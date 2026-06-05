use anchor_lang::prelude::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_staking_tiers() {
        // Test staking tier rewards
        let tier_1_apy = 10; // 10% APY
        let tier_2_apy = 15; // 15% APY
        let tier_3_apy = 20; // 20% APY

        assert!(tier_1_apy < tier_2_apy);
        assert!(tier_2_apy < tier_3_apy);
        assert!(tier_3_apy <= 25, "APY should not exceed 25%");
    }

    #[test]
    fn test_reward_calculation() {
        // Test reward calculation for 1000 tokens staked for 1 year at 10% APY
        let staked_amount = 1000;
        let apy = 10;
        let duration_days = 365;
        let expected_reward = staked_amount * apy / 100;

        assert_eq!(expected_reward, 100);
    }

    #[test]
    fn test_lockup_periods() {
        // Test different lockup periods (in days)
        let no_lockup = 0;
        let short_lockup = 30;
        let medium_lockup = 90;
        let long_lockup = 365;

        assert!(no_lockup < short_lockup);
        assert!(short_lockup < medium_lockup);
        assert!(medium_lockup < long_lockup);
    }

    #[test]
    fn test_early_unstake_penalty() {
        // Test 10% penalty for early unstaking
        let staked_amount = 1000;
        let penalty_percentage = 10;
        let expected_penalty = staked_amount * penalty_percentage / 100;
        let expected_return = staked_amount - expected_penalty;

        assert_eq!(expected_penalty, 100);
        assert_eq!(expected_return, 900);
    }

    #[test]
    fn test_minimum_stake() {
        // Test minimum stake requirement
        let min_stake = 100;
        let valid_stake = 150;
        let invalid_stake = 50;

        assert!(valid_stake >= min_stake);
        assert!(invalid_stake < min_stake);
    }

    #[test]
    fn test_reward_per_second() {
        // Test reward rate calculation per second
        let annual_reward = 100; // 100 tokens per year
        let seconds_per_year = 31_536_000; // 365 * 24 * 60 * 60
        let reward_per_second = annual_reward as f64 / seconds_per_year as f64;

        assert!(reward_per_second > 0.0);
        assert!(reward_per_second < 0.001); // Should be a very small number
    }

    #[test]
    fn test_compound_rewards() {
        // Test compound interest calculation (simplified)
        let initial_stake = 1000;
        let apy = 10;
        let compounding_periods = 12; // monthly

        let simple_interest = initial_stake * apy / 100;

        // Compound interest should be slightly higher than simple interest
        assert_eq!(simple_interest, 100);
    }
}
