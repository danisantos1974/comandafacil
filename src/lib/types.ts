export type TipoUsuario = 'atendente' | 'administrador';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: TipoUsuario;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
}

export type StatusMesa = 'disponivel' | 'ocupada';

export interface Mesa {
  id: number;
  numero: number;
  status: StatusMesa;
  comanda_ativa_id?: number | null;
}

export type StatusComanda = 'aberta' | 'finalizada';

export interface Comanda {
  id: number;
  mesa_id: number;
  mesa_numero?: number;
  usuario_id: number;
  usuario_nome?: string;
  status: StatusComanda;
  data_abertura: string;
  data_fechamento: string | null;
  valor_total: number;
  itens?: ItemComanda[];
}

export interface ItemComanda {
  id: number;
  comanda_id: number;
  produto_id: number;
  produto_nome?: string;
  produto_categoria?: string;
  quantidade: number;
  preco_unitario: number;
  subtotal?: number;
}

export interface AuthSession {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
}
