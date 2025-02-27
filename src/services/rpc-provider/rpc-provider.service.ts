import { Network } from '@balancer-labs/sdk';
import { JsonRpcProvider, WebSocketProvider } from '@ethersproject/providers';

import template from '@/lib/utils/template';
import ConfigService, { configService } from '@/services/config/config.service';

import { StaticJsonRpcBatchProvider } from './static-json-rpc-batch-provider';

type NewBlockHandler = (blockNumber: number) => any;

export default class RpcProviderService {
  readonly network: string;
  jsonProvider: JsonRpcProvider;
  wsProvider: WebSocketProvider;
  loggingProvider: JsonRpcProvider;

  constructor(private readonly config: ConfigService = configService) {
    this.network = this.config.network.shortName;
    this.jsonProvider = new StaticJsonRpcBatchProvider(this.config.rpc);
    this.wsProvider = new WebSocketProvider(this.config.ws);
    this.loggingProvider = new StaticJsonRpcBatchProvider(
      this.config.loggingRpc
    );
  }

  public initBlockListener(newBlockHandler: NewBlockHandler): void {
    this.wsProvider.on('block', newBlockNumber =>
      newBlockHandler(newBlockNumber)
    );
  }

  public async getBlockNumber(): Promise<number> {
    return await this.jsonProvider.getBlockNumber();
  }

  public getJsonProvider(networkKey: Network): JsonRpcProvider {
    const rpcUrl = template(this.config.getNetworkConfig(networkKey).rpc, {
      INFURA_KEY: this.config.env.INFURA_PROJECT_ID,
      ALCHEMY_KEY: this.config.env.ALCHEMY_KEY
    });
    return new StaticJsonRpcBatchProvider(rpcUrl);
  }
}

export const rpcProviderService = new RpcProviderService();
