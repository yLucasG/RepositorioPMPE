import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrabalhosService, LINHAS_PESQUISA, TIPOS_TRABALHO } from '../../trabalhos.service';

@Component({
  selector: 'app-novo',
  imports: [RouterLink],
  templateUrl: './novo.html',
  styleUrl: './novo.css',
})
export class NovoComponent {
  private readonly service = inject(TrabalhosService);
  readonly categorias = signal(LINHAS_PESQUISA);
  readonly tipos = signal(TIPOS_TRABALHO);
  readonly anos = signal(
    Array.from({ length: new Date().getFullYear() + 5 - 1989 }, (_, i) => new Date().getFullYear() + 5 - i)
  );

  readonly file = signal<File | null>(null);
  readonly loading = signal(false);
  readonly isLoadingAI = signal(false);
  readonly aiError = signal<string | null>(null);
  readonly status = signal<{ success?: boolean; error?: string } | null>(null);
  readonly formValues = signal({
    titulo: '', autor: '', resumo: '', referencias: '', categoria: '', tipo: '', ano: ''
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private processFile(file: File): void {
    if (!file.name.endsWith('.pdf')) {
      this.status.set({ error: 'Apenas arquivos PDF são permitidos.' });
      return;
    }
    this.file.set(file);
    this.status.set(null);
    this.aiError.set(null);
    this.isLoadingAI.set(true);

    this.service.extrairDadosIA(file).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.formValues.set({
            titulo: res.data.titulo || '',
            autor: res.data.autores || '',
            resumo: res.data.resumo || '',
            referencias: res.data.referencias || '',
            categoria: res.data.tema || '',
            tipo: res.data.tipo || '',
            ano: res.data.ano ? String(res.data.ano) : '',
          });
        } else {
          this.aiError.set('A IA não conseguiu extrair os dados. Preencha os campos manualmente.');
        }
        this.isLoadingAI.set(false);
      },
      error: (err) => {
        console.error('AI error:', err);
        const msg = err.status === 403
          ? 'Erro de autenticação com a IA (chave API inválida). Contate o administrador.'
          : err.status === 429
          ? 'Limite de requisições da IA excedido. Aguarde alguns minutos e tente novamente.'
          : 'A IA falhou ao analisar o documento. Você pode preencher os campos manualmente.';
        this.aiError.set(msg);
        this.isLoadingAI.set(false);
      },
    });
  }

  removeFile(): void {
    this.file.set(null);
  }

  updateField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.formValues.update(v => ({ ...v, [field]: value }));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const file = this.file();
    if (!file) {
      this.status.set({ error: 'Por favor, anexe um arquivo.' });
      return;
    }

    this.loading.set(true);
    this.status.set(null);
    const v = this.formValues();

    let urlArquivo: string;
    try {
      urlArquivo = await this.service.uploadArquivo(file);
    } catch (err: any) {
      this.status.set({ error: err.message || 'Erro ao enviar o arquivo.' });
      this.loading.set(false);
      return;
    }

    this.service.criarTrabalho({
      titulo: v.titulo,
      autor: v.autor,
      resumo: v.resumo,
      referencias: v.referencias.split('\n').filter(r => r.trim()) as any,
      ano: parseInt(v.ano, 10),
      categoria: v.categoria,
      tipo: v.tipo,
      url_arquivo: urlArquivo,
    }).subscribe({
      next: () => {
        this.status.set({ success: true });
        this.file.set(null);
        this.formValues.set({ titulo: '', autor: '', resumo: '', referencias: '', categoria: '', tipo: '', ano: '' });
        this.loading.set(false);
      },
      error: (err) => {
        this.status.set({ error: err.error?.error || 'Erro ao salvar trabalho.' });
        this.loading.set(false);
      },
    });
  }
}
