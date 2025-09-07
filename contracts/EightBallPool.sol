// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EightBallPool is ReentrancyGuard, Ownable, Pausable {
    struct Game {
        uint256 gameId;
        address player1;
        address player2;
        uint256 betAmount;
        address winner;
        bool isActive;
        bool isCompleted;
        bool isSoloPlay;
        uint256 createdAt;
        uint256 completedAt;
        GameResult result;
    }
    
    struct Player {
        address playerAddress;
        uint256 totalGames;
        uint256 wins;
        uint256 losses;
        uint256 totalWinnings;
        uint256 totalLosses;
        bool isRegistered;
    }
    
    enum GameResult {
        PENDING,
        PLAYER1_WIN,
        PLAYER2_WIN,
        DRAW,
        CANCELLED
    }
    
    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => Player) public players;
    mapping(address => uint256) public pendingWithdrawals;
    
    uint256 public nextGameId = 1;
    uint256 public houseEdge = 200; // 20% (200/1000)
    uint256 public minimumBet = 0.001 ether;
    uint256 public maximumBet = 10 ether;
    
    // Your house wallet address
    address public houseWallet = 0xd5c1960d24693105659bc740e065c049784639c7;
    uint256 public houseBalance = 0;
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount, bool isSoloPlay);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 winnings, uint256 houseCommission);
    event SoloPlayCompleted(uint256 indexed gameId, address indexed player, uint256 houseCommission);
    event GameCancelled(uint256 indexed gameId);
    event WithdrawalCompleted(address indexed player, uint256 amount);
    event HouseWithdrawal(address indexed houseWallet, uint256 amount);
    event PlayerRegistered(address indexed player);
    
    constructor() {
        _transferOwnership(msg.sender);
    }
    
    // Register player
    function registerPlayer() external {
        require(!players[msg.sender].isRegistered, "Player already registered");
        
        players[msg.sender] = Player({
            playerAddress: msg.sender,
            totalGames: 0,
            wins: 0,
            losses: 0,
            totalWinnings: 0,
            totalLosses: 0,
            isRegistered: true
        });
        
        emit PlayerRegistered(msg.sender);
    }
    
    // Create a multiplayer game with custom bet amount
    function createMultiplayerGame(uint256 betAmount) external payable nonReentrant whenNotPaused {
        require(msg.value == betAmount, "Sent value must match bet amount");
        require(betAmount >= minimumBet && betAmount <= maximumBet, "Invalid bet amount");
        require(players[msg.sender].isRegistered, "Player not registered");
        
        uint256 gameId = nextGameId++;
        
        games[gameId] = Game({
            gameId: gameId,
            player1: msg.sender,
            player2: address(0),
            betAmount: betAmount,
            winner: address(0),
            isActive: false,
            isCompleted: false,
            isSoloPlay: false,
            createdAt: block.timestamp,
            completedAt: 0,
            result: GameResult.PENDING
        });
        
        emit GameCreated(gameId, msg.sender, betAmount, false);
    }
    
    // Create a solo play game (pay house fee upfront)
    function createSoloPlay(uint256 betAmount) external payable nonReentrant whenNotPaused {
        require(msg.value == betAmount, "Sent value must match bet amount");
        require(betAmount >= minimumBet && betAmount <= maximumBet, "Invalid bet amount");
        require(players[msg.sender].isRegistered, "Player not registered");
        
        uint256 gameId = nextGameId++;
        
        // For solo play, house gets paid immediately
        uint256 houseCommission = betAmount; // House gets the full amount for solo play
        houseBalance += houseCommission;
        
        games[gameId] = Game({
            gameId: gameId,
            player1: msg.sender,
            player2: address(0),
            betAmount: betAmount,
            winner: address(0),
            isActive: true, // Solo play is immediately active
            isCompleted: false,
            isSoloPlay: true,
            createdAt: block.timestamp,
            completedAt: 0,
            result: GameResult.PENDING
        });
        
        // Update player stats
        players[msg.sender].totalGames++;
        players[msg.sender].totalLosses += betAmount;
        
        emit GameCreated(gameId, msg.sender, betAmount, true);
        emit SoloPlayCompleted(gameId, msg.sender, houseCommission);
    }
    
    // Join an existing multiplayer game
    function joinGame(uint256 gameId) external payable nonReentrant whenNotPaused {
        Game storage game = games[gameId];
        require(game.player1 != address(0), "Game does not exist");
        require(game.player2 == address(0), "Game already full");
        require(msg.sender != game.player1, "Cannot join your own game");
        require(msg.value == game.betAmount, "Bet amount mismatch");
        require(players[msg.sender].isRegistered, "Player not registered");
        require(!game.isSoloPlay, "Cannot join solo play games");
        
        game.player2 = msg.sender;
        game.isActive = true;
        
        emit GameJoined(gameId, msg.sender);
    }
    
    // Complete multiplayer game (only owner can call this)
    function completeMultiplayerGame(uint256 gameId, address winner) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        require(game.isActive && !game.isCompleted, "Invalid game state");
        require(!game.isSoloPlay, "This is a solo play game");
        require(winner == game.player1 || winner == game.player2, "Invalid winner");
        
        game.winner = winner;
        game.isCompleted = true;
        game.isActive = false;
        game.completedAt = block.timestamp;
        
        uint256 totalPot = game.betAmount * 2;
        uint256 houseCommission = (totalPot * houseEdge) / 1000; // 20% house edge
        uint256 winnerAmount = totalPot - houseCommission; // Winner gets 80%
        
        // Add house commission to house balance
        houseBalance += houseCommission;
        
        // Update player stats
        players[winner].wins++;
        players[winner].totalWinnings += winnerAmount;
        players[winner].totalGames++;
        
        address loser = (winner == game.player1) ? game.player2 : game.player1;
        players[loser].losses++;
        players[loser].totalLosses += game.betAmount;
        players[loser].totalGames++;
        
        // Add winner amount to pending withdrawals
        pendingWithdrawals[winner] += winnerAmount;
        
        game.result = (winner == game.player1) ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN;
        
        emit GameCompleted(gameId, winner, winnerAmount, houseCommission);
    }
    
    // Cancel game (only if no second player joined)
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.player1 == msg.sender, "Only game creator can cancel");
        require(game.player2 == address(0), "Cannot cancel game with two players");
        require(!game.isCompleted, "Game already completed");
        require(!game.isSoloPlay, "Cannot cancel solo play games");
        
        game.isCompleted = true;
        game.result = GameResult.CANCELLED;
        
        // Refund the bet
        pendingWithdrawals[msg.sender] += game.betAmount;
        
        emit GameCancelled(gameId);
    }
    
    // Player withdraw winnings
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit WithdrawalCompleted(msg.sender, amount);
    }
    
    // House withdraw earnings
    function withdrawHouseEarnings() external nonReentrant {
        require(msg.sender == houseWallet || msg.sender == owner(), "Only house wallet or owner can withdraw");
        require(houseBalance > 0, "No house earnings to withdraw");
        
        uint256 amount = houseBalance;
        houseBalance = 0;
        
        (bool success, ) = houseWallet.call{value: amount}("");
        require(success, "House withdrawal failed");
        
        emit HouseWithdrawal(houseWallet, amount);
    }
    
    // Get all available games for joining
    function getAvailableGames() external view returns (Game[] memory) {
        uint256 availableCount = 0;
        
        // Count available games
        for (uint256 i = 1; i < nextGameId; i++) {
            if (games[i].player2 == address(0) && !games[i].isCompleted && !games[i].isSoloPlay) {
                availableCount++;
            }
        }
        
        // Create array of available games
        Game[] memory availableGames = new Game[](availableCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextGameId; i++) {
            if (games[i].player2 == address(0) && !games[i].isCompleted && !games[i].isSoloPlay) {
                availableGames[index] = games[i];
                index++;
            }
        }
        
        return availableGames;
    }
    
    // View functions
    function getPlayerStats(address player) external view returns (Player memory) {
        return players[player];
    }
    
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
    
    function getPendingWithdrawal(address player) external view returns (uint256) {
        return pendingWithdrawals[player];
    }
    
    function getHouseBalance() external view returns (uint256) {
        return houseBalance;
    }
    
    // Owner functions
    function setHouseWallet(address _houseWallet) external onlyOwner {
        require(_houseWallet != address(0), "Invalid house wallet address");
        houseWallet = _houseWallet;
    }
    
    function setHouseEdge(uint256 _houseEdge) external onlyOwner {
        require(_houseEdge <= 500, "House edge too high"); // Max 50%
        houseEdge = _houseEdge;
    }
    
    function setBetLimits(uint256 _minimum, uint256 _maximum) external onlyOwner {
        require(_minimum < _maximum, "Invalid bet limits");
        minimumBet = _minimum;
        maximumBet = _maximum;
    }
}