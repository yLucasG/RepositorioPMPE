import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TrabalhosService } from '../../trabalhos.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly service = inject(TrabalhosService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const usuario = formData.get('usuario') as string;
    const senha = formData.get('senha') as string;

    this.loading.set(true);
    this.error.set(null);

    this.service.login(usuario, senha).subscribe({
      next: (res) => {
        if (res.success) {
          localStorage.setItem('admin_token', res.token);
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Usuário ou senha inválidos.');
        this.loading.set(false);
      },
    });
  }
}
