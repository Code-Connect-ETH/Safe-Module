//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

//EPNS Core Contract Interface
interface IEPNSCoreInterface {
   struct Channel {
        ChannelType channelType;
        uint8 channelState;
        address verifiedBy;
        uint256 poolContribution;
        uint256 channelHistoricalZ;
        uint256 channelFairShareCount;
        uint256 channelLastUpdate;
        uint256 channelStartBlock;
        uint256 channelUpdateBlock;
        uint256 channelWeight;
        uint256 expiryTime;
   }

   enum ChannelType {
        ProtocolNonInterest,    
        ProtocolPromotion,    
        InterestBearingOpen,  
        InterestBearingMutual,
        Timebound,
        TokenGaited
    }

   function createChannelWithPUSH(
        ChannelType _channelType,
        bytes calldata _identity,
        uint256 _amount,
        uint256 _channelExpiryTime
    )
        external;

    function getChannelState(address _channel)
        external
        view
        returns (uint256 state);
    }

//EPNS Comm Contract Interface
interface IPUSHCommInterface {
        function sendNotification(address _channel,
        address _recipient,
        bytes memory _identity
    )
        external;

        function addDelegate(address _delegate) external;

        function subscribe(address _channel) external returns (bool);

        function batchSubscribe(address[] calldata _channelList) external returns (bool);

        function subscribeViaCore(address _channel, address _user) external returns(bool);
}

//ERC20 Interface to approve sending dai
interface IERC20Interface {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract PushInterface  {
    address public EPNS_CORE_ADDRESS =0xd4E3ceC407cD36d9e3767cD189ccCaFBF549202C;
    address public EPNS_COMM_ADDRESS=0xb3971BCef2D791bc4027BbfedFb47319A4AAaaAa;
    address public PUSH_ADDRESS = 0x2b9bE9259a4F5Ba6344c1b1c07911539642a2D33;
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform the task");
        _;
    }
  
    //To create channel
    // function createChannelWithPUSH() public onlyOwner returns(IEPNSCoreInterface.Channel memory channel) {
    //     IERC20Interface(PUSH_ADDRESS).approve(EPNS_CORE_ADDRESS, 50 ether);
    //     IEPNSCoreInterface(EPNS_CORE_ADDRESS).createChannelWithPUSH(
    //         IEPNSCoreInterface.ChannelType.InterestBearingOpen,
    //         bytes('0'),
    //         50 ether,
    //         0
    //     );
    //     return channel;
    // }


    function addDelegate(address delegate) public {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).addDelegate(delegate);
    }

    function subscribe(address _channel) public returns (bool) {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).subscribe(_channel);
        return true;

    }

    function batchSubscribe(address[] calldata _channelList) public returns (bool) {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).batchSubscribe(_channelList);
        return true;
    }

    // function getChannelState(address _channel)
    //     external
    //     view
    //     returns (uint state)
    // {
    //     return IEPNSCoreInterface(EPNS_CORE_ADDRESS).getChannelState(_channel);

    // }

    // To send notification when the contract receives fund
     function sendMessage(address to, string memory body) external {
        IPUSHCommInterface(EPNS_COMM_ADDRESS).sendNotification(
    address(this), // from channel - recommended to set channel via dApp and put it's value -> then once contract is deployed, go back and add the contract address as delegate for your channel
    to, // to recipient, put address(this) in case you want Broadcast or Subset. For Targetted put the address to which you want to send
    bytes(
        string(
            // We are passing identity here: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
            abi.encodePacked(
                "0", // this is notification identity: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                "+", // segregator
                "1", // this is payload type: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/payload (1, 3 or 4) = (Broadcast, targetted or subset)
                "+", // segregator
                "Title", // this is notificaiton title
                "+", // segregator
                body // notification body
            )
        )
    )
);
    }
    
        
    
    function transferFundToOwner() public payable onlyOwner{
        owner.transfer(address(this).balance);
    }
    
    function checkAmount() public view returns(uint){
        return address(this).balance;
    }
}

