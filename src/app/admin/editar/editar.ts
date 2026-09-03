import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TrabalhosService, TrabalhoAcademico, LINHAS_PESQUISA, TIPOS_TRABALHO } from '../../trabalhos.service';

@Component({
  selector: 'app-editar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './editar.html',
  styleUrl: './editar.css',
})
export class EditarComponent implements OnInit {
  private readonly service = inject(TrabalhosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly categorias = signal(LINHAS_PESQUISA);
  readonly tipos = signal(TIPOS_TRABALHO);
  readonly anos = signal(
    Array.from({ length: new Date().getFullYear() + 5 - 1989 }, (_, i) => new Date().getFullYear() + 5 - i)
  );

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly status = signal<{ success?: boolean; error?: string } | null>(null);
  readonly formValues = signal({
    titulo: '', autor: '', resumo: '', referencias: '', categoria: '', tipo: '', ano: ''
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.carregarTrabalho(id);
    }
  }

  private carregarTrabalho(id: string): void {
    this.loading.set(true);
    this.service.getTrabalhoPorId(id).subscribe({
      next: (t) => {
        if (!this.anos().includes(t.ano)) {
          this.anos.update(lista => [t.ano, ...lista].sort((a, b) => b - a));
        }
        this.formValues.set({
          titulo: t.titulo,
          autor: t.autor,
          resumo: t.resumo,
          referencias: Array.isArray(t.referencias) ? t.referencias.join('\n') : t.referencias || '',
          categoria: t.categoria,
          tipo: t.tipo || '',
          ano: String(t.ano),
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading work:', err);
        this.status.set({ error: 'Erro ao carregar os dados do trabalho.' });
        this.loading.set(false);
      }
    });
  }

  updateField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.formValues.update(v => ({ ...v, [field]: value }));
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.status.set(null);
    const v = this.formValues();

    this.service.atualizarTrabalho(id, {
      titulo: v.titulo,
      autor: v.autor,
      resumo: v.resumo,
      referencias: v.referencias.split('\n').filter(r => r.trim()),
      ano: parseInt(v.ano, 10),
      categoria: v.categoria,
      tipo: v.tipo,
    }).subscribe({
      next: () => {
        this.status.set({ success: true });
        this.loading.set(false);
        // Opcional: redirecionar após sucesso
        setTimeout(() => this.router.navigate(['/admin']), 1500);
      },
      error: (err) => {
        this.status.set({ error: err.error?.error || 'Erro ao atualizar trabalho.' });
        this.loading.set(false);
      },
    });
  }
}
