import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HistoricoService {
  private transacoes = [
    { data: '2024-03-10', valor: 0.1, tipo: 'enviar' },
    { data: '2024-03-12', valor: 0.2, tipo: 'receber' },
    { data: '2024-04-01', valor: 0.5, tipo: 'enviar' }
  ];

  getTransacoesFiltradas(inicio: string, fim: string) {
    const inicioDate = new Date(inicio);
    const fimDate = new Date(fim);

    return this.transacoes.filter(t => {
      const data = new Date(t.data);
      return data >= inicioDate && data <= fimDate;
    });
  }
}
