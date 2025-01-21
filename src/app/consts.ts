import { HexString } from '@gear-js/api';

interface ContractSails {
  programId: HexString,
  idl: string
}

export const ACCOUNT_ID_LOCAL_STORAGE_KEY = 'account';

export const ADDRESS = {
  NODE: 'wss://testnet.vara.network' // import.meta.env.VITE_NODE_ADDRESS,
  // BACK: import.meta.env.VITE_BACKEND_ADDRESS,
  // GAME: import.meta.env.VITE_CONTRACT_ADDRESS as HexString,
};

export const ROUTES = {
  HOME: '/',
  GAME: '/game',
  NOTFOUND: '*',
};

// To use the example code, enter the details of the account that will pay the vouchers, etc. (name and mnemonic)
export const sponsorName = "admindavid";
export const sponsorMnemonic = "strong orchard plastic arena pyramid lobster lonely rich stomach label clog rubber";

export const CONTRACT_DATA: ContractSails = {
  programId: '0xaafaa281353453cdfd565bff27baf12a5a45ff8d7fcb2b70b707027e039b63e3',
  idl: `
type Bet2ChessEvents = enum {
  PlayingInMatch: u64,
  SignlessError: SignlessError,
  Error: Bet2ChessErrors,
  GameCreated: u64,
  JoinedInGame: u64,
  GameEnded: u64,
  InvitationSentTo: u64,
  InvitationCancelled,
  Price,
};

type SignlessError = enum {
  SignlessAccountHasInvalidSession,
  SignlessAccountNotApproved,
  SignlessAddressAlreadyEsists,
  UserAddressAlreadyExists,
  UserDoesNotHasSignlessAccount,
  NoWalletAccountAlreadyExists,
  NoWalletAccountDoesNotHasSignlessAccount,
  SessionHasInvalidSignlessAccount,
};

type Bet2ChessErrors = enum {
  GameIdDoesNotExists: u64,
  GameWithIdAlreadyStarts: u64,
  GameAlreadyStart: u64,
  BetIsNotTheSameForMatch: struct { game_bet: u128, bet_by_user: u128 },
  UserAlreadyInviteThePlayer: u64,
  UserHasNoInvitationfromTheUser: u64,
  UserAddressAndWeb2IdAreNotRelated,
  CantIncrementGamesIdItOverflow,
  InvitationDoesNotExists,
  ThereAreNoGamesWaiting,
  MinAmoutToBetIsOneToken,
  OnlyAdminsCanEndGames,
};

type GameData = struct {
  game_bet: u128,
  player1: actor_id,
  player2: actor_id,
  player1_username: str,
  player2_username: str,
  player1_web2_id: u64,
  player2_web2_id: u64,
  winner: opt actor_id,
  status: GameStatus,
};

type GameStatus = enum {
  Waiting,
  Started,
  Ended: struct { winner: opt actor_id },
};

type InvitationsState = struct {
  received_invitations_from_users: vec u64,
  sent_invitations_to_users: vec u64,
};

type QueryEvent = enum {
  GameData: GameData,
  SignlessAccountAddress: opt actor_id,
  SignlessAccountData: opt SignlessAccount,
};

type SignlessAccount = struct {
  address: str,
  encoded: str,
};

type SignlessEvent = enum {
  SignlessAccountSet,
  Error: SignlessError,
};

constructor {
  New : ();
};

service Bet2Chess {
  AcceptInvitation : (web2_user_id: u64, web2_user_id_invitation_owner: u64, web2_match_game_id: u64, username_from_user_who_invite: str, own_username: str) -> Bet2ChessEvents;
  AcceptInvitationSignless : (user_address: actor_id, web2_user_id: u64, web2_user_id_invitation_owner: u64, web2_match_game_id: u64, username_from_user_who_invite: str, own_username: str) -> Bet2ChessEvents;
  AcceptInvitationSignlessNoWallet : (no_wallet_name_encoded: str, web2_user_id: u64, web2_user_id_invitation_owner: u64, web2_match_game_id: u64, username_from_user_who_invite: str, own_username: str) -> Bet2ChessEvents;
  CancelInvitation : (first_web2_id: u64, second_web2_id: u64) -> Bet2ChessEvents;
  CancelInvitationSignless : (user_address: actor_id, first_web2_id: u64, second_web2_id: u64) -> Bet2ChessEvents;
  CancelInvitationSignlessNoWallet : (no_wallet_name_encoded: str, first_web2_id: u64, second_web2_id: u64) -> Bet2ChessEvents;
  EndGameById : (game_id: u64, game_winner: opt actor_id) -> Bet2ChessEvents;
  EndMatch : (game_id: u64, game_winner: opt actor_id) -> Bet2ChessEvents;
  SendInvitation : (web2_user_id: u64, web2_guest_id: u64) -> Bet2ChessEvents;
  SendInvitationSignless : (user_address: actor_id, web2_user_id: u64, web2_guest_id: u64) -> Bet2ChessEvents;
  SendInvitationSignlessNoWallet : (no_wallet_name_encoded: str, web2_user_id: u64, web2_guest_id: u64) -> Bet2ChessEvents;
  query AllGames : () -> vec struct { u64, GameData };
  query GameData : (game_id: u64) -> opt GameData;
  query GamesIdEnded : () -> vec u64;
  query GamesIdStarted : () -> vec u64;
  query GamesIdWaiting : () -> vec u64;
  query InvitationBet : (first_web2_id: u64, second_web2_id: u64) -> opt u128;
  query InvitationsFromWeb2Id : (web2_id: u64) -> opt InvitationsState;
};

service QueryService {
  query SignlessAccountData : (signless_address: actor_id) -> QueryEvent;
  query SignlessAddressFromNoWalletAccount : (no_wallet_account: str) -> QueryEvent;
  query SignlessAddressFromUserAddress : (user_address: actor_id) -> QueryEvent;
};

service Signless {
  BindSignlessDataToAddress : (user_address: actor_id, signless_data: SignlessAccount) -> SignlessEvent;
  BindSignlessDataToNoWalletAccount : (no_wallet_account: str, signless_data: SignlessAccount) -> SignlessEvent;
};
`};