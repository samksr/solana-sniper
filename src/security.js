const axios = require('axios');
class SecurityScanner {
    async scan(ca) {
        try {
            const url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${ca}`;
            const { data } = await axios.get(url);
            if (!data.result || !data.result[ca]) return null;
            const info = data.result[ca];
            let score = 100;
            const warnings = [];
            if (info.is_mintable === '1') { warnings.push('Mintable'); score -= 40; }
            if (info.is_freezable === '1') { warnings.push('Freezable'); score -= 30; }
            const tax = parseFloat(info.transfer_fee || 0);
            if (tax > 0) { warnings.push(`Tax ${tax}%`); score -= 10; }
            let top10 = 0;
            (info.holders || []).slice(0, 10).forEach(h => top10 += parseFloat(h.balance_percentage));
            if (top10 > 50) score -= 20;
            score = Math.max(0, score);
            return {
                score: score,
                riskColor: score > 80 ? '🟢' : (score > 50 ? '🟠' : '🔴'),
                mint: info.is_mintable === '1' ? '🔴' : '🟢',
                freeze: info.is_freezable === '1' ? '🔴' : '🟢',
                lp: info.lp_holders?.length > 0 ? '🔒 Locked' : '⚠️ Unlocked',
                holders: `${top10.toFixed(1)}%`,
                warnings: warnings.length > 0 ? warnings.join(', ') : 'None'
            };
        } catch (e) { return null; }
    }
}
module.exports = SecurityScanner;
