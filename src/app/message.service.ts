import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpDownloadProgressEvent, HttpResponse } from '@angular/common/http';
import { Observable, filter, map, startWith } from 'rxjs';

export interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  generating?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);

  private readonly _messages = signal<Message[]>([]);
  private readonly _completeMessages = signal<Message[]>([]);
  private readonly _generatingInProgress = signal<boolean>(false);

  readonly messages = this._messages.asReadonly();
  readonly generatingInProgress = this._generatingInProgress.asReadonly();

  private getChatResponseStream(prompt: string): Observable<Message> {
    const id = window.crypto.randomUUID();

    return this.http
      .post('http://localhost:3000/message', prompt, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        filter(
          (event: HttpEvent<string>): boolean =>
            event.type === HttpEventType.DownloadProgress ||
            event.type === HttpEventType.Response,
        ),
        map(
          (event: HttpEvent<string>): Message =>
            event.type === HttpEventType.DownloadProgress
              ? {
                id,
                text: (event as HttpDownloadProgressEvent).partialText!,
                fromUser: false,
                generating: true,
              }
              : {
                id,
                text: (event as HttpResponse<string>).body!,
                fromUser: false,
                generating: false,
              },
        ),
        startWith<Message>({
          id,
          text: '',
          fromUser: false,
          generating: true,
        }),
      );
  }

  sendMessage(prompt: string): void {
    this._generatingInProgress.set(true);

    this._completeMessages.set([
      ...this._completeMessages(),
      {
        id: window.crypto.randomUUID(),
        text: 'User: ' + prompt,
        fromUser: true,
      },
    ]);

    this.getChatResponseStream(prompt).subscribe({
      next: (message) => this._messages.set([...this._completeMessages(), message]),

      complete: () => {
        this._completeMessages.set(this._messages());
        this._generatingInProgress.set(false);
      },

      error: () => this._generatingInProgress.set(false),
    });
  }
}




