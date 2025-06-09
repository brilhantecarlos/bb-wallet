import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../Componentes/header/header.component';

@Component({
  selector: 'app-exportar-utxos',
  imports: [HeaderComponent],
  standalone: true,
  templateUrl: './exportar-utxos.component.html',
  styleUrls: ['./exportar-utxos.component.css']
})
export class ExportarUtxosComponent {

  constructor(private router: Router) {}

  exportar(tipo: 'csv' | 'json') {
    console.log(`Exportando como: ${tipo.toUpperCase()}`);
  }

  cancelar() {
    this.router.navigate(['/utxos']); 
  }
}
