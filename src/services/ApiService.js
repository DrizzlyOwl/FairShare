/**
 * ApiService.js
 * Handles external data fetching and regional detection logic.
 * Decoupled from the DOM.
 */

import { REGIONS, PREFIX_MAP } from '../core/Constants.js';

export default class ApiService {
    /**
     * Maps a postcode prefix to a UK region.
     * @param {string} postcode - The UK postcode to analyze.
     * @returns {Object|null} Regional data object or null if not found.
     */
    static getRegionFromPostcode(postcode) {
        const pc = postcode.trim().toUpperCase();
        if (!pc) return null;
        const areaMatch = pc.match(/^[A-Z]+/);
        if (!areaMatch) return null;
        const area = areaMatch[0];
        
        return PREFIX_MAP[area] || null;
    }

    /**
     * Estimates monthly water cost based on region, occupancy (beds), and number of bathrooms.
     * Heuristic: Standing Charge + (£12 per person) + (£5 per extra bathroom).
     * @param {string} postcode - The property postcode.
     * @param {number} beds - Number of bedrooms (used to estimate people).
     * @param {number} baths - Number of bathrooms.
     * @returns {number} Estimated monthly water cost in GBP.
     */
    static estimateWaterCost(postcode, beds, baths) {
        const region = this.getRegionFromPostcode(postcode);
        if (region && region.code === 'NI') return 0; // NI water is funded through rates

        const standingCharge = region ? region.cost : 18;
        const estimatedPeople = Math.max(1, beds); // Assume at least 1 person per bedroom
        const consumptionCost = estimatedPeople * 12;
        const extraBathCost = Math.max(0, baths - 1) * 5;

        return standingCharge + consumptionCost + extraBathCost;
    }

    /**
     * Fetches estimated market values via the UK Land Registry SPARQL endpoint.
     * Falls back to a heuristic estimate if the API call fails or returns no results.
     * @param {string} postcode - The target UK postcode.
     * @param {number} bedrooms - Number of bedrooms for fallback estimation.
     * @returns {Promise<number|Object>} Estimated price or object with price and isEstimated flag.
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
