
import snapshot from '@snapshot-labs/snapshot.js';
const hub = 'https://testnet.snapshot.org';
const client = new snapshot.Client712(hub);
import { mteWallet } from './initContracts';


const network = '8453';
const provider = snapshot.utils.getProvider(network);
const _mteWallet = mteWallet.connect(provider)

export const propose = async (address: string[], title: string, space: string) => {
    const date_now = new Date();
    const sec = Math.floor(date_now.getTime() / 1000);
    const block_no = await provider.getBlockNumber();
    const receipt = await client.proposal(_mteWallet, _mteWallet.address, {
        space: 'maxtestuma1204.eth',
        type: 'weighted', // define the voting system
        title: title,
        body: 'How many slices each contributor should get?',
        choices: address,
        start: sec + 10,
        end: sec + 60 * 5,
        snapshot: block_no,
        timestamp: sec,
        plugins: JSON.stringify({}),
        discussion: "",
        app: 'cc' // provide the name of your project which is using this snapshot.js integration
    }) as { id: string };
    return receipt.id;
}
