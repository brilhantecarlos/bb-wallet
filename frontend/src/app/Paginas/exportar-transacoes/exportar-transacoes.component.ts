import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HistoricoService } from '../../Service/historico.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../Componentes/header/header.component';

@Component({
  selector: 'app-exportar-transacoes',
  imports: [FormsModule, HeaderComponent],
  standalone: true,
  templateUrl: './exportar-transacoes.component.html',
  styleUrls: ['./exportar-transacoes.component.css']
})
export class ExportarTransacoesComponent {
  dataInicio!: string;
  dataFim!: string;
  formatoSelecionado: string = 'csv';

  constructor(
    private router: Router,
    private historicoService: HistoricoService
  ) {}

  voltar() {
    this.router.navigate(['/historicotrans']);
  }

  exportar() {
    const transacoes = this.historicoService.getTransacoesFiltradas(this.dataInicio, this.dataFim);

    if (this.formatoSelecionado === 'csv') {
      this.exportarCSV(transacoes);
    } else if (this.formatoSelecionado === 'json') {
      this.exportarJSON(transacoes);
    } else if (this.formatoSelecionado === 'excel') {
      this.exportarExcel(transacoes);
    }
  }

  exportarCSV(data: any[]) {
    const csvContent = data.map(item => Object.values(item).join(',')).join('\n');
    this.downloadArquivo(csvContent, 'exportacao.csv', 'text/csv');
  }

  exportarJSON(data: any[]) {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadArquivo(jsonContent, 'exportacao.json', 'application/json');
  }

  exportarExcel(data: any[]) {
    alert('Exportação para Excel ainda não implementada.');
  }

  downloadArquivo(conteudo: string, nome: string, tipo: string) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
