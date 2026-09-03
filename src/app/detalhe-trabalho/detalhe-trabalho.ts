import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrabalhosService, TrabalhoAcademico } from '../trabalhos.service';

@Component({
  selector: 'app-detalhe-trabalho',
  imports: [RouterLink],
  templateUrl: './detalhe-trabalho.html',
  styleUrl: './detalhe-trabalho.css',
})
export class DetalheTrabalhoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly trabalhosService = inject(TrabalhosService);

  readonly trabalho = signal<TrabalhoAcademico | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly mostrarReferencias = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID do trabalho não encontrado.');
      this.loading.set(false);
      return;
    }

    this.trabalhosService.getTrabalhoPorId(id).subscribe({
      next: (data) => {
        this.trabalho.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar trabalho:', err);
        this.error.set('Não foi possível carregar o trabalho.');
        this.loading.set(false);
      },
    });
  }

  toggleReferencias(): void {
    this.mostrarReferencias.update(v => !v);
  }

  registrarDownload(): void {
    const t = this.trabalho();
    if (!t) return;

    this.trabalhosService.registrarDownload(t.id).subscribe({
      next: () => {
        // Incrementa localmente para feedback imediato
        this.trabalho.set({ ...t, downloads: t.downloads + 1 });
        window.open(t.url_arquivo, '_blank');
      },
      error: () => {
        // Abre mesmo se falhar o registro
        window.open(t.url_arquivo, '_blank');
      },
    });
  }
}
