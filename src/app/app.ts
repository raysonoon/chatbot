import { Component, effect, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { MessageService } from './message.service';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, FormsModule],
  template: `
    <h1>🤖 ChatMeImBot</h1>

    @for (message of messages(); track message.id) {
      <pre
        class="message"
        [ngClass]="{
          'from-user': message.fromUser,
          generating: message.generating
        }"
        [innerHTML]="formatMessage(message.text)"
        >{{ message.text }}</pre
      >
    }

    <form #form="ngForm" (ngSubmit)="sendMessage(form, form.value.message)">
      <textarea
        name="message"
        placeholder="What's on your mind?"
        ngModel
        required
        autofocus
        [disabled]="generatingInProgress()"
        rows="3"
        style="width: 100%; resize: vertical;"
        (keydown.enter)="onEnterKey($event, form)"
      ></textarea>
      <button type="submit" [disabled]="generatingInProgress() || form.invalid">
        Send
      </button>
    </form>
  `,
})
export class App {
  private readonly messageService = inject(MessageService);

  readonly messages = this.messageService.messages;
  readonly generatingInProgress = this.messageService.generatingInProgress;

  private readonly scrollOnMessageChanges = effect(() => {
    // run this effect on every `messages` change
    this.messages();

    // scroll after the messages render
    setTimeout(() =>
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      }),
    );
  });

  // hit enter key to send message
  onEnterKey(event: Event, form: NgForm) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey && !this.generatingInProgress() && !form.invalid) {
      keyboardEvent.preventDefault();
      this.sendMessage(form, form.value.message);
    }
  }

  sendMessage(form: NgForm, messageText: string): void {
    this.messageService.sendMessage(messageText);
    form.resetForm();
  }

  // format message
  formatMessage(text: string): string {
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
}