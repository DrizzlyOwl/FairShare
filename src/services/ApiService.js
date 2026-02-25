/**
 * ApiService.js
 * Handles external data fetching and regional detection logic.
 * Decoupled from the DOM.
 */

export const REGIONS = {
    NI: { name: 'Northern Ireland', prefixes: ['BT'], cost: 0, code: 'NI' },
    SCOTLAND: { name: 'Scotland', prefixes: ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'], cost: 42, code: 'SC' },
    WALES: { name: 'Wales', prefixes: ['CF', 'LD', 'LL', 'NP', 'SA', 'SY'], cost: 55, code: 'WA' },
    SOUTH_WEST: { name: 'South West', prefixes: ['BA', 'BH', 'BS', 'DT', 'EX', 'PL', 'SN', 'SP', 'TA', 'TQ', 'TR'], cost: 62, code: 'EN' },
    SOUTH: { name: 'South', prefixes: ['BN', 'CT', 'GU', 'ME', 'OX', 'PO', 'RG', 'RH', 'SL', 'TN'], cost: 58, code: 'EN' },
    LONDON: { name: 'London', prefixes: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC', 'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB', 'WD'], cost: 54, code: 'EN' },
    EAST: { name: 'East of England', prefixes: ['AL', 'CB', 'CM', 'CO', 'EN', 'HP', 'IP', 'LU', 'NR', 'RM', 'SG', 'SS'], cost: 52, code: 'EN' },
    MIDLANDS: { name: 'Midlands', prefixes: ['B', 'CV', 'DE', 'DY', 'HR', 'LE', 'LN', 'NG', 'NN', 'ST', 'SY', 'TF', 'WR', 'WS', 'WV'], cost: 48, code: 'EN' },
    NORTH: { name: 'North of England', prefixes: ['BB', 'BD', 'BL', 'CA', 'CH', 'CW', 'DH', 'DL', 'DN', 'FY', 'HD', 'HG', 'HU', 'HX', 'L', 'LA', 'LS', 'M', 'NE', 'OL', 'PR', 'S', 'SK', 'SR', 'TS', 'WA', 'WF', 'WN', 'YO'], cost: 45, code: 'EN' }
};

export default class ApiService {
    /**
     * Maps a postcode prefix to a UK region.
     */
    static getRegionFromPostcode(postcode) {
        const pc = postcode.trim().toUpperCase();
        if (!pc) return null;
        const areaMatch = pc.match(/^[A-Z]+/);
        if (!areaMatch) return null;
        const area = areaMatch[0];
        for (const regionKey in REGIONS) {
            if (REGIONS[regionKey].prefixes.includes(area)) {
                return { key: regionKey, ...REGIONS[regionKey] };
            }
        }
        return null;
    }

    /**
     * Estimates monthly water cost based on region and number of bathrooms.
     */
    static estimateWaterCost(postcode, bathrooms) {
        const region = this.getRegionFromPostcode(postcode);
        const baseCost = region ? region.cost : 50;
        return baseCost + (Math.max(0, bathrooms - 1) * 5);
    }

    /**
     * Fetches estimated market values via the UK Land Registry SPARQL endpoint.
     */
    static async getEstimatedPropertyPrice(postcode, bedrooms) {
        const sparqlQuery = `
            PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
            PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
            SELECT ?amount WHERE {
                ?addr lrcommon:postcode "${postcode}" .
                ?transx lrppi:propertyAddress ?addr ;
                        lrppi:pricePaid ?amount .
            } LIMIT 10
        `;
        const endpointUrl = 'https://landregistry.data.gov.uk/landregistry/query';
        const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const bindings = data.results.bindings;
            
            if (bindings.length === 0) throw new Error("No data found");
            
            const total = bindings.reduce((acc, curr) => acc + parseInt(curr.amount.value), 0);
            const average = total / bindings.length;
            return Math.round(average / 1000) * 1000;
        } catch (_error) {
            // Fallback: Heuristic estimation
            const postcodePrefix = postcode.charAt(0);
            let basePrice = 250000;
            if (['L', 'M', 'B', 'S', 'N', 'G'].includes(postcodePrefix)) basePrice = 180000;
            else if (['W', 'E'].includes(postcodePrefix) || postcode.startsWith('SW') || postcode.startsWith('SE')) basePrice = 450000;
            basePrice += ((bedrooms - 2) * 35000);
            return {
                price: Math.max(50000, Math.round(basePrice / 1000) * 1000),
                isEstimated: true
            };
        }
    }
}
