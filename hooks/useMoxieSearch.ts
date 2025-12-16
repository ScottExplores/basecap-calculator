import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

// Mainnet URL for Moxie Protocol Stats Subgraph (via The Graph Decentralized or Studio Public)
// Using a known public endpoint or the one found in research.
// We will try the Graph Explorer URL format first.
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/23537/moxie_protocol_stats_mainnet/version/latest';

export interface MoxieToken {
    id: string; // Token Address
    symbol: string;
    name: string;
    totalSupply: string;
    uniqueHolders: string;
}

const SEARCH_QUERY = gql`
    query SearchTokens($query: String!) {
        subjectTokens(
            first: 10
            where: { symbol_contains: $query }
            orderBy: uniqueHolders
            orderDirection: desc
        ) {
            id
            symbol
            name
            totalSupply
            uniqueHolders
        }
    }
`;

export function useMoxieSearch(query: string) {
    return useQuery({
        queryKey: ['moxieSearch', query],
        queryFn: async () => {
            if (!query || query.length < 2) return [];

            try {
                // Determine if we should search by symbol (username usually in symbol) or name
                // Moxie symbols like "fid:602" or "dwr"
                // Let's assume input matches symbol for now.
                const variables = { query: query.toLowerCase() };
                const data: any = await request(SUBGRAPH_URL, SEARCH_QUERY, variables);
                return data.subjectTokens as MoxieToken[];
            } catch (error) {
                console.error("Moxie Subgraph Error:", error);
                return [];
            }
        },
        enabled: query.length >= 2,
        staleTime: 60000,
    });
}
