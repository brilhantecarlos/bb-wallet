import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface StatusResponse {
  txid: string;
  status: 'confirmed' | 'pending' | 'not_found';
  confirmations?: number;
  block_height?: number;
  block_hash?: string;
  timestamp?: string;
  explorer_url?: string;
  error?: string;
}

@Component({
  selector: 'app-consultar-status-transacao',
  templateUrl: './consultar-status-transacao.component.html',
  styleUrls: ['./consultar-status-transacao.component.css']
})
export class ConsultarStatusTransacaoComponent {
  txid: string = '';
  network: 'mainnet' | 'testnet' = 'testnet';
  statusResponse: StatusResponse | null = null;
  loading: boolean = false;
  errorMsg: string = '';

  constructor(private http: HttpClient) {}

  consultarStatus() {
    this.errorMsg = '';
    this.statusResponse = null;

    if (!this.txid || this.txid.length !== 64) {
      this.errorMsg = 'Por favor, insira um TXID válido com 64 caracteres hexadecimais.';
      return;
    }

    this.loading = true;

    const baseUrl = `http://localhost:8000/status/${this.txid}?network=${this.network}`;

    this.http.get<StatusResponse>(baseUrl).subscribe({
      next: (data) => {
        this.statusResponse = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 404) {
          this.errorMsg = 'Transação não encontrada na blockchain.';
        } else {
          this.errorMsg = 'Erro ao consultar o status da transação. Tente novamente.';
        }
      }
    });
  }
}
