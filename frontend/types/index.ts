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

export interface Comment {
  cId: number;
  uId: number;
  mId?: number;
  content: string;
  created_at: string;
  uname?: string;
  level?: number;
  parent_id?: number | null;
}

export interface NewBet {
  amt: number;
  yes: boolean;
} 