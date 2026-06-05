/* eslint-disable react/no-unescaped-entities */
import React from 'react';

interface MetricDocProps {
    name: string;
    description: string;
    range?: string;
    type?: string;
}

const MetricDoc: React.FC<MetricDocProps> = ({ name, description, range, type }) => (
    <div className="bg-black/30 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all">
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-white">{name}</h4>
            {type && <span className="text-xs bg-purple-500/30 px-2 py-1 rounded text-purple-300">{type}</span>}
        </div>
        <p className="text-gray-400 text-sm mb-2">{description}</p>
        {range && <p className="text-xs text-gray-500">Range: {range}</p>}
    </div>
);

interface MetricCategoryProps {
    title: string;
    emoji: string;
    children: React.ReactNode;
}

const MetricCategory: React.FC<MetricCategoryProps> = ({ title, emoji, children }) => (
    <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>{emoji}</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{title}</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
            {children}
        </div>
    </div>
);

export const AdvancedMetricsSection: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-2xl font-bold mb-3">🔬 Advanced Metrics (30+ Calculations)</h3>
            <p className="text-gray-300">
                DegenScore analyzes your wallet with institutional-grade metrics. These are calculated from your complete Solana trading history.
            </p>
        </div>

        <MetricCategory title="Fee Tracking" emoji="💰">
            <MetricDoc name="Network Fees" description="Total SOL spent on Solana network transaction fees" type="SOL" />
            <MetricDoc name="DEX Fees" description="Trading fees paid to DEXes (Raydium 0.25%, Jupiter 0.2%, etc.)" type="SOL" />
            <MetricDoc name="Priority Fees" description="Extra fees paid for faster transaction processing" type="SOL" />
            <MetricDoc name="Total Fees" description="Complete fee breakdown: Network + DEX + Priority" type="SOL" />
        </MetricCategory>

        <MetricCategory title="DCA & Position Tracking" emoji="📈">
            <MetricDoc name="Weighted Avg Entry" description="True average entry price when buying same token multiple times (DCA)" type="Price" />
            <MetricDoc name="Consolidated Positions" description="All your positions grouped by token with accurate cost basis" type="Object" />
            <MetricDoc name="Cost Basis" description="Total amount invested in each token position" type="SOL" />
        </MetricCategory>

        <MetricCategory title="USD Conversion" emoji="💵">
            <MetricDoc name="SOL Price USD" description="Current SOL price fetched from Jupiter API" type="USD" />
            <MetricDoc name="Profit/Loss USD" description="Your P&L converted to USD for easy comparison" type="USD" />
            <MetricDoc name="Total Volume USD" description="Total trading volume in USD terms" type="USD" />
        </MetricCategory>

        <MetricCategory title="Airdrop Detection" emoji="🎁">
            <MetricDoc name="Airdrops Received" description="Number of tokens received without paying (detected airdrops)" type="Count" />
            <MetricDoc name="Airdrop Value" description="Estimated value of received airdrops" type="SOL" />
            <MetricDoc name="Airdrop Tokens" description="List of token mints received as airdrops" type="Array" />
        </MetricCategory>

        <MetricCategory title="DEX Statistics" emoji="🏦">
            <MetricDoc name="DEX Breakdown" description="Trading stats per DEX: Raydium, Jupiter, Orca, Pump.fun, etc." type="Object" />
            <MetricDoc name="Trades per DEX" description="How many trades executed on each platform" type="Count" />
            <MetricDoc name="Volume per DEX" description="SOL volume traded on each platform" type="SOL" />
            <MetricDoc name="Fees per DEX" description="Fees paid to each DEX" type="SOL" />
        </MetricCategory>

        <MetricCategory title="Data Quality" emoji="✅">
            <MetricDoc name="Data Completeness" description="Percentage of how complete and accurate the analysis is" range="0-100%" type="Percent" />
            <MetricDoc name="Failed Transactions" description="Number of failed transactions detected" type="Count" />
            <MetricDoc name="Analysis Time" description="How long the analysis took in milliseconds" type="ms" />
        </MetricCategory>
    </div>
);

export const ProMetricsSection: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-2xl font-bold mb-3">📈 PRO Level Analytics (Hedge Fund Metrics)</h3>
            <p className="text-gray-300">
                Professional-grade metrics used by institutional traders and quantitative analysts. These metrics help you understand your trading performance at a deeper level.
            </p>
        </div>

        <MetricCategory title="Multi-Timeframe Analysis" emoji="📅">
            <MetricDoc name="Last 24h Performance" description="Trades, P&L, and win rate in the last 24 hours" type="Object" />
            <MetricDoc name="Last 7d Performance" description="Weekly performance snapshot" type="Object" />
            <MetricDoc name="Last 30d Performance" description="Monthly performance breakdown" type="Object" />
            <MetricDoc name="All-Time Performance" description="Complete historical performance" type="Object" />
        </MetricCategory>

        <MetricCategory title="Alpha Generation" emoji="🎯">
            <MetricDoc name="vs SOL HODL" description="% outperformance vs just holding SOL" range="-∞ to +∞%" type="Percent" />
            <MetricDoc name="vs BTC" description="% performance compared to Bitcoin" range="-∞ to +∞%" type="Percent" />
            <MetricDoc name="Alpha Positive" description="True if you're beating the market" type="Boolean" />
            <MetricDoc name="Skill Score" description="0-100 skill assessment based on alpha generation" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Risk Metrics" emoji="⚠️">
            <MetricDoc name="Value at Risk (95%)" description="Maximum loss expected in 95% of cases" type="Percent" />
            <MetricDoc name="Sortino Ratio" description="Risk-adjusted return using only downside volatility" type="Ratio" />
            <MetricDoc name="Calmar Ratio" description="Return divided by Maximum Drawdown" type="Ratio" />
            <MetricDoc name="Tail Ratio" description="Upside potential vs downside risk" type="Ratio" />
            <MetricDoc name="Recovery Factor" description="Net profit divided by max drawdown" type="Ratio" />
        </MetricCategory>

        <MetricCategory title="Session Analysis" emoji="🌍">
            <MetricDoc name="Asia Session" description="Performance during Asian trading hours (00:00-08:00 UTC)" type="Object" />
            <MetricDoc name="Europe Session" description="Performance during European hours (08:00-16:00 UTC)" type="Object" />
            <MetricDoc name="US Session" description="Performance during US hours (16:00-00:00 UTC)" type="Object" />
            <MetricDoc name="Best Session" description="Which session you perform best in" type="String" />
        </MetricCategory>

        <MetricCategory title="Profit Taking Behavior" emoji="💰">
            <MetricDoc name="Avg Profit Take %" description="Average percentage at which you take profits" type="Percent" />
            <MetricDoc name="Holds Too Long" description="Tendency to give back gains by holding too long" type="Boolean" />
            <MetricDoc name="Takes Too Early" description="Tendency to take profits too early" type="Boolean" />
            <MetricDoc name="Optimal Exit Score" description="0-100 quality of your exit timing" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Loss Cutting Behavior" emoji="🛡️">
            <MetricDoc name="Avg Loss Cut %" description="Average percentage at which you cut losses" type="Percent" />
            <MetricDoc name="Cuts Losses Well" description="Good at limiting downside" type="Boolean" />
            <MetricDoc name="Diamond Hands Loser" description="Holds losing positions too long" type="Boolean" />
            <MetricDoc name="Risk Management Score" description="0-100 risk management quality" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Entry Timing" emoji="⏰">
            <MetricDoc name="Early Entries" description="Tokens bought in first 24h after launch" type="Count" />
            <MetricDoc name="Mid Entries" description="Tokens bought 1-7 days after launch" type="Count" />
            <MetricDoc name="Late Entries" description="Tokens bought 7+ days after launch" type="Count" />
            <MetricDoc name="Early Bird Score" description="0-100 how early you find good tokens" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Streak Analysis" emoji="🔥">
            <MetricDoc name="Current Streak" description="Current win/loss streak (positive = wins)" type="Number" />
            <MetricDoc name="Longest Win Streak" description="Your best winning streak ever" type="Count" />
            <MetricDoc name="Longest Loss Streak" description="Your worst losing streak ever" type="Count" />
            <MetricDoc name="Streak Consistency" description="0-100 how consistent your streaks are" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Consistency Metrics" emoji="📊">
            <MetricDoc name="Weekly Consistency" description="% of profitable weeks" type="Percent" />
            <MetricDoc name="Monthly Consistency" description="% of profitable months" type="Percent" />
            <MetricDoc name="Is Consistent Trader" description="True if consistently profitable" type="Boolean" />
            <MetricDoc name="Consistency Score" description="0-100 overall consistency rating" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Trading Style Classification" emoji="🎭">
            <MetricDoc name="Primary Style" description="Scalper, Day Trader, Swing Trader, Position Holder, or Degen Ape" type="String" />
            <MetricDoc name="Risk Tolerance" description="Conservative, Moderate, Aggressive, or YOLO" type="String" />
            <MetricDoc name="Market Fit" description="Best market conditions for your style (Bull/Bear/Sideways)" type="String" />
            <MetricDoc name="AI Recommendation" description="Personalized advice based on your trading patterns" type="String" />
        </MetricCategory>
    </div>
);

export const EliteMetricsSection: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-2xl font-bold mb-3">🏆 ELITE Level Analytics (AI-Powered Insights)</h3>
            <p className="text-gray-300">
                The most advanced trading analytics in Web3. These metrics provide deep psychological and behavioral insights that no other platform offers.
            </p>
        </div>

        <MetricCategory title="Psychological Patterns" emoji="🧠">
            <MetricDoc name="FOMO Score" description="0-100 tendency to FOMO into trades" range="0-100" type="Score" />
            <MetricDoc name="Panic Sell Score" description="0-100 tendency to panic sell on dips" range="0-100" type="Score" />
            <MetricDoc name="Revenge Trading Score" description="0-100 tendency to revenge trade after losses" range="0-100" type="Score" />
            <MetricDoc name="Overconfidence Score" description="0-100 tendency to oversize after wins" range="0-100" type="Score" />
            <MetricDoc name="Emotional Control" description="0-100 overall emotional discipline" range="0-100" type="Score" />
            <MetricDoc name="Tilt Detected" description="Warning if currently on trading tilt" type="Boolean" />
        </MetricCategory>

        <MetricCategory title="Position Sizing Analysis" emoji="📐">
            <MetricDoc name="Avg Position Size" description="Average SOL per trade" type="SOL" />
            <MetricDoc name="Max Position Size" description="Largest single position taken" type="SOL" />
            <MetricDoc name="Position Variance" description="How much your position sizes vary" type="Number" />
            <MetricDoc name="Kelly Criterion Score" description="0-100 how close to optimal sizing" range="0-100" type="Score" />
            <MetricDoc name="Oversizing Risk" description="Warning if taking too large positions" type="Boolean" />
        </MetricCategory>

        <MetricCategory title="Whale Behavior" emoji="🐋">
            <MetricDoc name="Is Whale" description="True if total volume > 100 SOL" type="Boolean" />
            <MetricDoc name="Price Impact" description="Estimated % price impact of your trades" type="Percent" />
            <MetricDoc name="Moves Markets" description="True if trades are large enough to move price" type="Boolean" />
            <MetricDoc name="Whale Score" description="0-100 whale status classification" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Bot vs Human Detection" emoji="🤖">
            <MetricDoc name="Human Probability" description="0-100% likelihood of being a human trader" range="0-100%" type="Percent" />
            <MetricDoc name="Bot Indicators" description="List of detected bot-like behaviors" type="Array" />
            <MetricDoc name="Trading Speed" description="Instant, Fast, Normal, or Slow" type="String" />
            <MetricDoc name="Pattern Regularity" description="0-100 how regular trading patterns are" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Recovery Patterns" emoji="💪">
            <MetricDoc name="Avg Recovery Time" description="Seconds to recover from a losing streak" type="Seconds" />
            <MetricDoc name="Recovers Quickly" description="Good at bouncing back from losses" type="Boolean" />
            <MetricDoc name="Doubles Down on Loss" description="Bad habit: increases size after losses" type="Boolean" />
            <MetricDoc name="Takes Break After Loss" description="Good habit: pauses trading after losses" type="Boolean" />
            <MetricDoc name="Recovery Score" description="0-100 recovery ability rating" range="0-100" type="Score" />
        </MetricCategory>

        <MetricCategory title="Trading Approach" emoji="🎯">
            <MetricDoc name="Momentum Score" description="0-100 tendency to follow momentum" range="0-100" type="Score" />
            <MetricDoc name="Contrarian Score" description="0-100 tendency to go against the trend" range="0-100" type="Score" />
            <MetricDoc name="Breakout Trader" description="Tends to trade breakouts" type="Boolean" />
            <MetricDoc name="Dip Buyer" description="Tends to buy dips" type="Boolean" />
            <MetricDoc name="Top Buyer" description="Warning: tends to buy tops" type="Boolean" />
            <MetricDoc name="Approach Type" description="Momentum, Contrarian, or Mixed" type="String" />
        </MetricCategory>

        <MetricCategory title="Portfolio Metrics" emoji="📂">
            <MetricDoc name="Concentration Score" description="0-100 how concentrated your portfolio is" range="0-100" type="Score" />
            <MetricDoc name="Top Token %" description="% of volume in largest position" type="Percent" />
            <MetricDoc name="Top 3 Tokens %" description="% of volume in top 3 positions" type="Percent" />
            <MetricDoc name="Diversification Level" description="Concentrated, Balanced, or Diversified" type="String" />
            <MetricDoc name="Optimal Allocation" description="True if allocation is well-balanced" type="Boolean" />
        </MetricCategory>

        <MetricCategory title="Rotation Speed" emoji="🔄">
            <MetricDoc name="Avg Hold Duration" description="Average seconds holding a position" type="Seconds" />
            <MetricDoc name="Rotation Speed" description="Ultra Fast, Fast, Moderate, Slow, or HODLer" type="String" />
            <MetricDoc name="Churn Rate" description="Portfolio turnover rate" type="Percent" />
            <MetricDoc name="Overtrading" description="Warning if trading too frequently" type="Boolean" />
        </MetricCategory>

        <MetricCategory title="Gas Optimization" emoji="⛽">
            <MetricDoc name="Avg Priority Fee" description="Average priority fee paid per transaction" type="SOL" />
            <MetricDoc name="Overpays Gas" description="Warning if paying too much for gas" type="Boolean" />
            <MetricDoc name="Gas Efficiency Score" description="0-100 how efficiently you use gas" range="0-100" type="Score" />
            <MetricDoc name="Total Gas Spent" description="Total SOL spent on all fees" type="SOL" />
        </MetricCategory>

        <MetricCategory title="Trade Quality Breakdown" emoji="📊">
            <MetricDoc name="Excellent Trades" description="Trades with >50% profit" type="Count" />
            <MetricDoc name="Good Trades" description="Trades with 10-50% profit" type="Count" />
            <MetricDoc name="Break Even Trades" description="Trades with -10% to +10%" type="Count" />
            <MetricDoc name="Bad Trades" description="Trades with -10% to -50% loss" type="Count" />
            <MetricDoc name="Terrible Trades" description="Trades with >50% loss" type="Count" />
            <MetricDoc name="Quality Distribution" description="Visual breakdown of trade quality" type="String" />
        </MetricCategory>

        <MetricCategory title="Learning Curve" emoji="📚">
            <MetricDoc name="Improving Over Time" description="True if win rate is increasing" type="Boolean" />
            <MetricDoc name="Recent vs Old Win Rate" description="Difference between recent and old performance" type="Percent" />
            <MetricDoc name="Learning Score" description="0-100 rate of improvement" range="0-100" type="Score" />
            <MetricDoc name="Plateau Detected" description="Warning if improvement has stalled" type="Boolean" />
        </MetricCategory>

        <MetricCategory title="Comprehensive Analysis" emoji="🎓">
            <MetricDoc name="Overall Skill Score" description="0-100 combined trading skill assessment" range="0-100" type="Score" />
            <MetricDoc name="Strength Areas" description="List of what you're good at" type="Array" />
            <MetricDoc name="Weakness Areas" description="List of areas to improve" type="Array" />
            <MetricDoc name="Trader Rank" description="Novice, Beginner, Intermediate, Advanced, Expert, or Elite" type="String" />
            <MetricDoc name="Percentile Bracket" description="Top 1%, 5%, 10%, 25%, or 50%" type="String" />
            <MetricDoc name="Personalized Advice" description="AI-generated recommendations for improvement" type="Array" />
        </MetricCategory>
    </div>
);

export default { AdvancedMetricsSection, ProMetricsSection, EliteMetricsSection };
