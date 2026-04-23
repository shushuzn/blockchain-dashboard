import { getLogger } from '../utils/logger';

const logger = getLogger('graphql');
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_URL || '/graphql';

export async function graphqlQuery(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      logger.error('GraphQL errors:', { errors: result.errors });
      throw new Error(result.errors[0].message);
    }

    return result.data;
  } catch (error) {
    logger.error('GraphQL request failed:', { error });
    throw error;
  }
}

export const CHAINS_QUERY = `
  query Chains {
    chains {
      id
      name
      color
      hasBlob
      hasMEV
      current {
        gas
        baseFee
        blobFee
        blockNumber
        util
        txs
        mev
      }
      history {
        t
        gas
        baseFee
        blobFee
        util
      }
    }
  }
`;

export const CHAIN_QUERY = `
  query Chain($id: String!) {
    chain(id: $id) {
      id
      name
      color
      hasBlob
      hasMEV
      current {
        gas
        baseFee
        blobFee
        blockNumber
        util
        txs
        mev
      }
      history {
        t
        gas
        baseFee
        blobFee
        util
      }
    }
  }
`;

export const PRICES_QUERY = `
  query Prices {
    prices {
      eth {
        usd
        usd_24h_change
      }
      btc {
        usd
        usd_24h_change
      }
    }
  }
`;

export const MEME_COINS_QUERY = `
  query MemeCoins {
    memeCoins {
      symbol
      name
      price_usd
      volume_24h
      percent_change_24h
    }
  }
`;

export const LIDO_TVL_QUERY = `
  query LidoTVL {
    lidoTVL {
      totalTvlUsd
      ethTvlUsd
      ethStakedCount
      apy
    }
  }
`;

export const AAVE_TVL_QUERY = `
  query AaveTVL {
    aaveTVL {
      totalLiquidityUSD
      totalBorrowsUSD
      markets {
        symbol
        totalSupply
        totalBorrows
        supplyAPY
        borrowAPY
      }
    }
  }
`;

export const CONFIG_QUERY = `
  query Config {
    config {
      alertEnabled
      cooldownMin
      thresholds {
        ethereum {
          gas
          baseFee
          blobFee
          mev
        }
        base {
          gas
          baseFee
          blobFee
        }
        arbitrum {
          gas
          baseFee
        }
        optimism {
          gas
          baseFee
        }
      }
    }
  }
`;

export const ALERTS_QUERY = `
  query Alerts($limit: Int) {
    alerts(limit: $limit) {
      id
      time
      chain
      metric
      value
      threshold
    }
  }
`;

export default {
  graphqlQuery,
  CHAINS_QUERY,
  CHAIN_QUERY,
  PRICES_QUERY,
  MEME_COINS_QUERY,
  LIDO_TVL_QUERY,
  AAVE_TVL_QUERY,
  CONFIG_QUERY,
  ALERTS_QUERY,
};
