import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-constuir-transacao',
  templateUrl: './constuir-transacao.component.html',
  styleUrls: ['./constuir-transacao.component.css']
})
export class ConstuirTransacaoComponent {
  inputs: any[] = [
    { txid: '', vout: 0, value: 0, script: '' }
  ];
  outputs: any[] = [
    { address: '', value: 0 }
  ];
  fee_rate: number = 2.0;
  network: 'mainnet' | 'testnet' = 'testnet';
  resultado: any = null;
  erro: string = '';

  constructor(private http: HttpClient) {}

  construirTransacao() {
    const body = {
      inputs: this.inputs,
      outputs: this.outputs,
      fee_rate: this.fee_rate
    };

    const url = `http://bitcoin-wallet:8000/api/tx/build?network=${this.network}`;
    
    this.http.post(url, body).subscribe({
      next: (data) => {
        this.resultado = data;
        this.erro = '';
      },
      error: (err) => {
        this.resultado = null;
        this.erro = err.error?.detail || 'Erro ao construir transação';
      }
    });
  }

  adicionarInput() {
    this.inputs.push({ txid: '', vout: 0, value: 0, script: '' });
  }

  removerInput(i: number) {
    this.inputs.splice(i, 1);
  }

  adicionarOutput() {
    this.outputs.push({ address: '', value: 0 });
  }

  removerOutput(i: number) {
    this.outputs.splice(i, 1);
  }
}
