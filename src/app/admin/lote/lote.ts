import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrabalhosService } from '../../trabalhos.service';

@Component({
  selector: 'app-lote',
  imports: [RouterLink],
  templateUrl: './lote.html',
  styleUrl: './lote.css',
})
export class LoteComponent {
  private readonly service = inject(TrabalhosService);

  readonly isBatchUploading = signal(false);
  readonly isWaitingDelay = signal(false);
  readonly totalFiles = signal(0);
  readonly currentFileIndex = signal(0);
  readonly sucessos = signal<string[]>([]);
  readonly erros = signal<{ filename: string; reason: string }[]>([]);
  readonly status = signal<{ finished?: boolean; error?: string } | null>(null);

  get progressPercentage(): number {
    return this.totalFiles() > 0 ? Math.round((this.currentFileIndex() / this.totalFiles()) * 100) : 0;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files).filter(f => f.name.endsWith('.pdf'));
      if (files.length > 0) this.processFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private async processFiles(files: File[]): Promise<void> {
    this.isBatchUploading.set(true);
    this.totalFiles.set(files.length);
    this.currentFileIndex.set(0);
    this.sucessos.set([]);
    this.erros.set([]);
    this.status.set(null);

    for (let i = 0; i < files.length; i++) {
      this.currentFileIndex.set(i + 1);

      try {
        // 1. Extract with AI
        const aiRes = await this.service.extrairDadosIA(files[i]).toPromise();

        if (aiRes?.success && aiRes.data) {
          // 2. Upload do PDF para o Storage
          const urlArquivo = await this.service.uploadArquivo(files[i]);

          // 3. Save to DB
          await this.service.criarTrabalho({
            titulo: aiRes.data.titulo || files[i].name,
            autor: aiRes.data.autores || '',
            resumo: aiRes.data.resumo || '',
            referencias: aiRes.data.referencias ? aiRes.data.referencias.split('\n').filter(r => r.trim()) as any : [],
            ano: aiRes.data.ano || new Date().getFullYear(),
            categoria: aiRes.data.tema || '',
            tipo: aiRes.data.tipo || '',
            url_arquivo: urlArquivo,
          }).toPromise();

          this.sucessos.update(list => [...list, aiRes.data.titulo || files[i].name]);
        } else {
          this.erros.update(list => [...list, { filename: files[i].name, reason: 'IA não retornou dados válidos' }]);
        }

        // 4. Delay 10s between files
        if (i < files.length - 1) {
          this.isWaitingDelay.set(true);
          await new Promise(resolve => setTimeout(resolve, 10000));
          this.isWaitingDelay.set(false);
        }
      } catch (error: any) {
        console.error(`Falha ao processar "${files[i].name}":`, error?.error ?? error);
        const reason = error?.error?.error || error?.message || 'Erro desconhecido';
        this.erros.update(list => [...list, { filename: files[i].name, reason }]);
      }
    }

    this.isBatchUploading.set(false);
    this.status.set({ finished: true });
  }
}
