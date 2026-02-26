/**
 * ApiService.js
 * Handles external data fetching and regional detection logic.
 * Decoupled from the DOM.
 */

import { REGIONS } from '../core/Constants.js';

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
        for (const regionKey in REGIONS) {
            if (REGIONS[regionKey].prefixes.includes(area)) {
                return { key: regionKey, ...REGIONS[regionKey] };
            }
        }
        return null;
    }

    /**
     * Estimates monthly water cost based on region and number of bathrooms.
     * @param {string} postcode - The property postcode.
     * @param {number} bathrooms - Number of bathrooms in the property.
     * @returns {number} Estimated monthly water cost in GBP.
     */
    static estimateWaterCost(postcode, bathrooms) {
        const region = this.getRegionFromPostcode(postcode);
        const baseCost = region ? region.cost : 50;
        return baseCost + (Math.max(0, bathrooms - 1) * 5);
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
