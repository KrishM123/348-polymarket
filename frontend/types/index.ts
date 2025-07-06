export interface Market {
  mId: number;
  name: string;
  description?: string;
  podd: number;
  volume: number;
  end_date?: string;
}

export interface Bet {
  bId: number;
  uId: number;
  mId: number;
  podd: number;
  amt: number;
  yes: boolean;
  uname?: string;
  createdAt?: string;
}

export interface NewBet {
  amt: number;
  yes: boolean;
}

export interface Comment {
  cId: number;
  content: string;
  created_at: string;
  uId: number;
  uname: string;
  parent_id: number | null;
  level: number;
} 