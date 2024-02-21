import {Provider} from 'zksync-ethers'
import { ZkSyncProviderAdapter } from '../src/provider-adapter';
import { expect } from 'chai';

describe("Provider adapter", () => {
    const provider = new ZkSyncProviderAdapter(new Provider('https://sepolia.era.zksync.dev'));
    it('Tests provider send method',async()=>{
        const chainId = await provider.send('eth_chainId',[]);
        expect(chainId===300)
    })
    it('Tests provider request method',async()=>{
        const chainId = await provider.request({method:'eth_chainId'})
        expect(chainId===300)

    })
    it('Tests provider send async with response',async ()=>{
        await provider.sendAsync({method:'eth_chainId',params:[]},(err,res)=>{
            expect(err===null)
            expect(res==="0x12c")
        })
    })
    it('Tests provider send async with error',async ()=>{
        await provider.sendAsync({method:'net_chainId',params:[]},(err,res)=>{
            expect(err!==null)
        })
    })
})